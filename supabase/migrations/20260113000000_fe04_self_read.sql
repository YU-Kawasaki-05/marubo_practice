-- FE-04 Step 1: 自分のメールアドレスに関する allowlist を閲覧できるようにする

-- 解説: RLS (Row Level Security) を有効にします。
-- これにより、テーブル内のすべての行がデフォルトで見えなくなります（アクセス拒否）。
-- 「許可された条件」に合う行だけが見えるようになります。
ALTER TABLE allowed_email ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除（念のため）
DROP POLICY IF EXISTS "Users can view own allowlist" ON allowed_email;

-- 新しいポリシーを作成
-- "using" の中身が「鍵」の条件です。
-- auth.jwt() ->> 'email' : ログインしているユーザーのメールアドレス（トークンから取得）
-- email : テーブルに保存されているメールアドレス
-- つまり、「自分のメールアドレスのデータだけは見てもいいよ」というルールです。
CREATE POLICY "Users can view own allowlist"
ON allowed_email
FOR SELECT
USING (
  email = auth.jwt() ->> 'email'
);
