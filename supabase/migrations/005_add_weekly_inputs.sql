-- weekly_store_inputs 新設
CREATE TABLE IF NOT EXISTS weekly_store_inputs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  week_start          date        NOT NULL,
  sales               integer,
  visits              integer,
  next_visit_count    integer,
  next_visit_rate     numeric,
  new_customers       integer,
  repeat_customers    integer,
  availability_score  integer     CHECK (availability_score BETWEEN 1 AND 5),
  memo                text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (store_id, week_start)
);

ALTER TABLE weekly_store_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはweekly_store_inputsを操作できる"
  ON weekly_store_inputs FOR ALL USING (auth.role() = 'authenticated');

-- weekly_staff_inputs 新設
CREATE TABLE IF NOT EXISTS weekly_staff_inputs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   uuid        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id   uuid        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  week_start date        NOT NULL,
  sales      integer,
  visits     integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (staff_id, week_start)
);

ALTER TABLE weekly_staff_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはweekly_staff_inputsを操作できる"
  ON weekly_staff_inputs FOR ALL USING (auth.role() = 'authenticated');

-- updated_at トリガー
CREATE TRIGGER weekly_store_inputs_updated_at
  BEFORE UPDATE ON weekly_store_inputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER weekly_staff_inputs_updated_at
  BEFORE UPDATE ON weekly_staff_inputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
