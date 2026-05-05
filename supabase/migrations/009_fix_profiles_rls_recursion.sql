-- ============================================================
-- 009_fix_profiles_rls_recursion.sql
-- 問題: profiles の "ownerは全プロフィールを読める" ポリシーが
--       profiles テーブルを自己参照 → PostgreSQL 無限再帰エラー (42P17)
--       → fetchProfile が常に null を返し、profile が null のまま
--       → loadData が呼ばれず「データを取得できませんでした」が表示される
--
-- 修正: SECURITY DEFINER 関数 get_my_role() を使って再帰を回避
-- ============================================================

DROP POLICY IF EXISTS "ownerは全プロフィールを読める" ON profiles;

CREATE POLICY "ownerは全プロフィールを読める" ON profiles
  FOR SELECT USING (get_my_role() = 'owner');
