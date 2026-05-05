-- ============================================================
-- 007_cron_jobs.sql
-- Edge Function 定期実行スケジュール設定
--
-- 前提: Supabase Dashboard で pg_cron 拡張を有効化しておくこと
--   Dashboard > Database > Extensions > pg_cron
--
-- Supabase クラウドの場合はDashboard > Edge Functions > Schedules
-- から GUI で設定することも可能（推奨）。
-- ============================================================

-- pg_cron が有効な場合のみ実行
-- （Supabase Dashboardで有効化していない場合はコメントアウトしたまま手動設定）

-- ============================================================
-- 毎月1日 15:00 UTC（= 翌日 00:00 JST）
-- 全店舗の当月月次報告書レコードを自動生成
-- ============================================================
select cron.schedule(
  'create-monthly-reports',   -- ジョブ名（重複時はエラーになるので一意にする）
  '0 15 1 * *',               -- 毎月1日 15:00 UTC
  $$
    select
      net.http_post(
        url      := current_setting('app.edge_function_url') || '/create-monthly-reports',
        headers  := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body     := '{}',
        timeout_milliseconds := 30000
      );
  $$
);

-- ============================================================
-- 毎月6日 15:00 UTC（= 翌日 00:00 JST）
-- 前月分の未提出店舗を幹部にメールで通知
-- ============================================================
select cron.schedule(
  'report-submission-alert',
  '0 15 6 * *',               -- 毎月6日 15:00 UTC
  $$
    select
      net.http_post(
        url      := current_setting('app.edge_function_url') || '/report-submission-alert',
        headers  := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body     := '{}',
        timeout_milliseconds := 30000
      );
  $$
);

-- ============================================================
-- app設定（プロジェクトURLとキーを実際の値に置き換えること）
-- Supabase Dashboard > Settings > API から確認できる
-- ============================================================
-- alter database postgres set app.edge_function_url = 'https://<project-ref>.supabase.co/functions/v1';
-- alter database postgres set app.service_role_key  = '<service_role_key>';

-- ============================================================
-- スケジュール確認クエリ（実行後の確認用）
-- ============================================================
-- select jobname, schedule, command, active from cron.job;

-- ============================================================
-- スケジュール削除（やり直す場合）
-- ============================================================
-- select cron.unschedule('create-monthly-reports');
-- select cron.unschedule('report-submission-alert');
