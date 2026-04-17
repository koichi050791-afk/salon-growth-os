-- Step1: staffテーブルにauth_user_idを追加
ALTER TABLE staff ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

-- Step2: profilesテーブルを作成
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'staff',
  staff_id   uuid        REFERENCES staff(id),
  store_id   uuid        REFERENCES stores(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ読める
CREATE POLICY "自分のプロフィールのみ読める" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 自分のプロフィールのみ更新できる
CREATE POLICY "自分のプロフィールのみ更新できる" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 使い方メモ
-- ============================================================
-- 管理者ユーザーを登録する場合（Supabase DashboardでEmail作成後）：
--   INSERT INTO profiles (id, role) VALUES ('<auth.users.id>', 'admin');
--
-- スタッフユーザーを登録する場合：
--   INSERT INTO profiles (id, role, staff_id, store_id)
--     VALUES ('<auth.users.id>', 'staff', '<staff.id>', '<stores.id>');
--   UPDATE staff SET auth_user_id = '<auth.users.id>' WHERE id = '<staff.id>';
