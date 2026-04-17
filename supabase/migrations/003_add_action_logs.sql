CREATE TABLE IF NOT EXISTS action_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  week_date   date        NOT NULL,
  action_text text,
  is_executed boolean,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (staff_id, week_date)
);

CREATE TRIGGER action_logs_updated_at
  BEFORE UPDATE ON action_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
