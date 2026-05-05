-- ============================================================
-- 006_add_monthly_reports.sql
-- 月次報告書機能 - DBスキーマ拡張
-- ============================================================

-- ============================================================
-- monthly_reports テーブル
-- ============================================================
create table if not exists monthly_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  year_month date not null, -- 月初日で統一 例：2025-05-01

  -- スタッフ数
  staff_count int,

  -- 売上実績（手入力）
  total_sales int,
  tech_sales int,
  retail_sales int,
  tech_unit_price int,
  tech_customer_count int,
  new_customer_count int,
  discount_rate numeric(5,2),

  -- 昨年実績（手入力）
  last_year_total_sales int,
  last_year_tech_sales int,
  last_year_retail_sales int,

  -- 目標（手入力）
  target_total_sales int,
  target_tech_sales int,
  target_retail_sales int,

  -- メニュー別件数
  color_count int,
  perm_count int,
  straight_count int,
  treatment_count int,
  spa_count int,
  machine_count int,

  -- リピート率
  new_customer_visit int,
  new_customer_repeat int,
  new_repeat_rate numeric(5,2),
  existing_customer_visit int,
  existing_customer_repeat int,
  existing_repeat_rate numeric(5,2),
  repeat_rate_3m numeric(5,2),
  repeat_rate_6m numeric(5,2),

  -- KPI診断連動
  -- 構造: [{ "diagnosis_result_id": "uuid", "issue": "...", "cause": "...",
  --          "action": "...", "status": "in_progress"|"resolved"|"carried_over",
  --          "resolved_at": null }]
  adopted_actions jsonb default '[]'::jsonb,

  -- 定性情報
  promoted_staff text,
  product_requests text,
  notes text,

  -- 提出情報
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(store_id, year_month)
);

-- updated_at 自動更新トリガー
create trigger monthly_reports_updated_at
  before update on monthly_reports
  for each row execute function update_updated_at();

-- ============================================================
-- RLSポリシー
-- ============================================================
alter table monthly_reports enable row level security;

-- 幹部・店長のみ閲覧可
create policy "managers can view monthly reports"
on monthly_reports for select
using (
  exists (
    select 1 from staff
    where staff.auth_user_id = auth.uid()
    and staff.role in ('manager', 'executive')
  )
);

-- 自店舗の店長のみ挿入可
create policy "store manager can insert own report"
on monthly_reports for insert
with check (
  exists (
    select 1 from staff
    where staff.auth_user_id = auth.uid()
    and staff.store_id = monthly_reports.store_id
    and staff.role in ('manager', 'executive')
  )
);

-- 自店舗の店長のみ編集可（未提出の間）
create policy "store manager can edit own report"
on monthly_reports for update
using (
  submitted_at is null
  and exists (
    select 1 from staff
    where staff.auth_user_id = auth.uid()
    and staff.store_id = monthly_reports.store_id
    and staff.role = 'manager'
  )
);

-- 幹部はすべての店舗を編集可
create policy "executive can edit all reports"
on monthly_reports for update
using (
  exists (
    select 1 from staff
    where staff.auth_user_id = auth.uid()
    and staff.role = 'executive'
  )
);

-- ============================================================
-- monthly_summary_view（daily_recordsから月次集計）
-- 実際のdaily_recordsカラム: sales, visits, record_date
-- ============================================================
create or replace view monthly_summary_view as
select
  store_id,
  date_trunc('month', record_date)::date as year_month,
  sum(sales)  as auto_total_sales,
  sum(visits) as auto_tech_customer_count,
  case
    when sum(visits) > 0
    then round(sum(sales)::numeric / sum(visits), 0)
    else 0
  end as auto_tech_unit_price
from daily_records
group by store_id, date_trunc('month', record_date)::date;

-- ============================================================
-- diagnosis_results に書き戻し用カラムを追加（Step 4用）
-- ============================================================
alter table diagnosis_results
  add column if not exists resolved_by_report_id uuid references monthly_reports(id),
  add column if not exists resolved_at timestamptz;
