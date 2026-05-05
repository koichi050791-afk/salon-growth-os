-- Step1: get_my_store_id関数を追加（SECURITY DEFINER）
CREATE OR REPLACE FUNCTION get_my_store_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT store_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Step2: monthly_reportsの既存ポリシーを全削除
DROP POLICY IF EXISTS monthly_reports_select ON monthly_reports;
DROP POLICY IF EXISTS monthly_reports_insert ON monthly_reports;
DROP POLICY IF EXISTS monthly_reports_update ON monthly_reports;

-- Step3: ポリシーを再作成（profilesへの直接JOINなし）
CREATE POLICY monthly_reports_select ON monthly_reports
FOR SELECT USING (
  get_my_role() = 'owner'
  OR get_my_role() = 'viewer'
  OR (get_my_role() = 'manager' AND store_id = get_my_store_id())
);

CREATE POLICY monthly_reports_insert ON monthly_reports
FOR INSERT WITH CHECK (
  get_my_role() = 'owner'
  OR (get_my_role() = 'manager' AND store_id = get_my_store_id())
);

CREATE POLICY monthly_reports_update ON monthly_reports
FOR UPDATE USING (
  get_my_role() = 'owner'
  OR (get_my_role() = 'manager' AND store_id = get_my_store_id() AND submitted_at IS NULL)
);
