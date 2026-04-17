-- ============================================================
-- 001_create_tables.sql
-- Salon Growth OS - Initial table creation
-- ============================================================

-- テーブル1: stores（店舗）
CREATE TABLE IF NOT EXISTS stores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code  text        NOT NULL UNIQUE,
  store_name  text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- テーブル2: staff（スタッフ）
CREATE TABLE IF NOT EXISTS staff (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  role       text        NOT NULL DEFAULT 'stylist',
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- テーブル3: monthly_configs（月次基準値）
CREATE TABLE IF NOT EXISTS monthly_configs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  target_month        text        NOT NULL,
  target_sales        numeric,
  target_unit_price   numeric,
  target_visits       integer,
  target_productivity numeric,
  target_repeat_rate  numeric,
  memo                text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (store_id, target_month)
);

-- テーブル4: daily_records（日次実績）
CREATE TABLE IF NOT EXISTS daily_records (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  record_date        date        NOT NULL,
  sales              numeric,
  visits             integer,
  unit_price         numeric,
  repeat_rate        numeric,
  new_customers      integer,
  existing_customers integer,
  working_hours      numeric,
  notes              text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (store_id, record_date)
);

-- テーブル5: diagnosis_results（診断結果）
CREATE TABLE IF NOT EXISTS diagnosis_results (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  daily_record_id     uuid        REFERENCES daily_records(id),
  config_id           uuid        REFERENCES monthly_configs(id),
  diagnosis_status    text        NOT NULL,
  summary             text,
  issues              jsonb,
  recommended_actions jsonb,
  created_at          timestamptz DEFAULT now()
);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER monthly_configs_updated_at
  BEFORE UPDATE ON monthly_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- サンプルデータ: 三田店
-- ============================================================
INSERT INTO stores (store_code, store_name) VALUES ('mita', '三田店');
