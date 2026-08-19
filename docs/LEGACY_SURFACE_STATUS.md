# Legacy Surface Status

2026-08-19時点。

旧Salon Growth OSの店舗管理機能は、データ保全とロールバックのためコード上は一時保持するが、池田航一個人の美容師OSでは通常導線から外す。

## 現役

- `/` 池田航一｜美容師OS HOME
- `/decision-input` Decision記録
- `/decisions` Decision時間軸
- `/project` 130万円安定達成プロジェクト
- `/login` 個人OSログイン

## Legacy / 通常導線から除外

- `/weekly-input`
- `/dashboard`
- `/overview`
- `/monthly-report`
- `/monthly-config`
- `/staff`
- `/actions`
- 店舗選択・全店管理・スタッフ管理に依存する旧UI

## 方針

旧route / repository / Supabase tableはこの段階では削除しない。
新しい個人OSのProduction安定確認後に、依存関係を確認しながら段階的に削除する。
