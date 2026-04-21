-- ============================================================
-- ふぁみりんく Seed Data (開発用サンプルデータ)
-- ※ 本番環境には適用しないこと
-- ============================================================

-- ※ auth.usersへの直接INSERTはSupabaseダッシュボードまたはAPIで行う
-- ここではfamiliesおよびchildrenのサンプル構造のみ示す

-- サンプルデータの挿入は supabase dashboard の
-- SQL Editor または seed ジョブで実行してください。

-- 例: テスト家族（UUIDは実際のauth.usersのIDに置き換えること）
/*
insert into families (name, invite_code, owner_id) values
  ('山田家', 'YAMADA', '00000000-0000-0000-0000-000000000001');

insert into family_members (family_id, user_id, role, display_name) values
  ((select id from families where invite_code = 'YAMADA'),
   '00000000-0000-0000-0000-000000000001',
   'owner', 'ひろみ');

insert into children (family_id, name, birth_date, color, school_name, class_name) values
  ((select id from families where invite_code = 'YAMADA'),
   'はなこ', '2019-04-15', '#FF6B9D', 'さくら保育園', 'ゆり組'),
  ((select id from families where invite_code = 'YAMADA'),
   'たろう', '2021-08-20', '#4ECDC4', 'さくら保育園', 'たんぽぽ組');
*/
