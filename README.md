# 池田航一｜美容師OS

池田航一個人のサロンワークを、Decision（判断）中心で学習へ変えるための Experience Learning System。

## 最上位目標

9:00〜18:00の勤務と家族との時間を守りながら、月間技術売上130万円を持続的・安定的に達成し、その理由を説明・再現できる状態を作る。

## 現在フェーズ

ホップ｜現場検証

観察 → 仮説 → 小さく試す → 結果を見る → 修正する。

完成した経営システムを先に作るのではなく、池田航一の場合に何が無理なく成果へつながるかを現場から発見する。

## 現在の主要画面

- `/` — 池田個人OS HOME
- `/decision-input` — 5項目・3分以内のDecision記録
- `/decisions` — AirtableをSource of TruthとするDecision時間軸
- `/project` — 130万円安定達成プロジェクト
- `/login` — 個人OS認証

## Decisionの最小入力

1. 相談
2. 確認した事実
3. 今回の判断
4. あえてしなかったこと
5. 次回確認

事実と仮説は混同しない。単一CaseからKnowledgeを確定しない。

## データの役割

- Airtable — Decisionの正本
- Supabase — 現在は認証のみ
- Vercel — Webアプリの実行環境
- GitHub — コードと変更履歴

旧Salon Growth OSの店舗管理・全店管理・週次KPI・スタッフ管理・月報機能は現行プロダクトから廃止する。旧DBデータの物理削除は、必要性とバックアップを確認した別工程で扱う。


## Threads / note 集客・収益化OS

Threads・noteは別プロジェクトとして増やさず、この美容師OSの「集客・収益化を学習する運用層」として扱う。

正本:
- `docs/threads-os/threads-operating-system.md` — 全体ルール
- `docs/threads-os/research.md` — リサーチ担当
- `docs/threads-os/planning.md` — 企画担当
- `docs/threads-os/writing.md` — 執筆担当
- `docs/threads-os/review.md` — 検品担当
- `docs/threads-os/note-title-rules.md` — 有料noteタイトル設計
- `docs/threads-os/baseline-2026-09-28.md` — 比較開始点
- `docs/threads-os/manual-publish-policy.md` — Threads全アカウント手動公開ルール
- `docs/threads-os/posting-pack-format.md` — AIからHuman Gateへ渡す投稿パック形式

目的は表示数や投稿量を増やすことではない。

集客:
Threads → プロフィール → note / 公式Web → 相談・予約 → 実来店 → 技術売上

収益化:
無料接触 → Evidence → 教育 → 有料記事 → 購入 → 次商品

までを一つの系として検証し、再利用できた判断だけをKnowledge候補にする。
