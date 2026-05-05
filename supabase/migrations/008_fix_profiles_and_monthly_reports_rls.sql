-- ============================================================
-- 008_fix_profiles_and_monthly_reports_rls.sql
-- 問題1: profiles テーブルに display_name / updated_at カラムを追加
-- 問題2: monthly_reports の RLS ポリシーを profiles ベースに修正
-- ============================================================

-- ============================================================
-- 1. profiles テーブルの不足カラムを追加
--    migration 004 では display_name / updated_at が未定義だった
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();

-- ============================================================
-- 2. monthly_reports の RLS ポリシーを修正
--    旧ポリシーは staff.role in ('manager','executive') を参照していたが、
--    アプリの認証は profiles.role ('owner'/'manager'/'viewer') で管理しているため
--    SELECT/INSERT/UPDATE が常にブロックされていた
-- ============================================================
DROP POLICY IF EXISTS "managers can view monthly reports"    ON monthly_reports;
DROP POLICY IF EXISTS "store manager can insert own report"  ON monthly_reports;
DROP POLICY IF EXISTS "store manager can edit own report"    ON monthly_reports;
DROP POLICY IF EXISTS "executive can edit all reports"       ON monthly_reports;

-- SELECT: owner/viewer は全店舗、manager は自店舗のみ
CREATE POLICY "view monthly reports"
ON monthly_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role IN ('owner', 'viewer')
      OR (profiles.role = 'manager' AND profiles.store_id = monthly_reports.store_id)
    )
  )
);

-- INSERT: owner は全店舗、manager は自店舗のみ（viewer は不可）
CREATE POLICY "insert monthly reports"
ON monthly_reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'owner'
      OR (profiles.role = 'manager' AND profiles.store_id = monthly_reports.store_id)
    )
  )
);

-- UPDATE: owner は全店舗、manager は自店舗の未提出レポートのみ
CREATE POLICY "update monthly reports"
ON monthly_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.role = 'owner'
      OR (
        profiles.role = 'manager'
        AND profiles.store_id = monthly_reports.store_id
        AND monthly_reports.submitted_at IS NULL
      )
    )
  )
);
