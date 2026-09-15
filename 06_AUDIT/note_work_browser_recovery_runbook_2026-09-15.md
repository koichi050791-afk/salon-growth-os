# note Workブラウザ復旧時ランブック

作成日：2026年9月15日

## 起動条件

Workブラウザでnoteへ再接続できた時だけ実行する。

池田航一から「note Workブラウザ復旧した」「ログインできた」等の連絡があれば、このランブックを最優先で使用する。

最初から監査・商品設計・36記事棚卸しはやり直さない。

## Step 1｜n41ff077db644 修復

対象：
https://note.com/ikeda_dx/n/n41ff077db644

削除対象は次の2点のみ。

1. 誤挿入されたP1500 CTA文
2. https://note.com/ikeda_dx/n/nb4e5373b26b4

元の本文順：

「Instagramの投稿文を作る。」
→
「Threadsの文章を考える。」

に戻す。

禁止：

- CTA再追加
- 全文選択
- 一括置換
- 他本文の修正
- 表現改善
- 関連記事追加

保存前に局所変更だけであることを確認する。

## Step 2｜公開確認

公開ページで次を確認する。

- 誤挿入CTA文がない
- P1500 URLがない
- Instagram→Threadsの流れが自然
- その他本文が保持されている
- スマートフォン表示に異常がない

完了後：

`REPAIRED / PUBLIC_VERIFIED`

へ更新する。

## Step 3｜売上管理画面

個人情報を保存せず、取得可能な集計値だけ確認する。

対象商品：

- P100：https://note.com/ikeda_dx/n/n32daf2fbb2a2
- P500：https://note.com/ikeda_dx/n/n2181c7875fa1
- P1500：https://note.com/ikeda_dx/n/nb4e5373b26b4

取得候補：

- 商品別販売件数
- 商品別売上
- 購入発生の有無
- 複数商品購入人数（集計として確認できる場合だけ）
- 平均購入単価（取得可能な数字から正確に算出できる場合だけ）

購入者名・メール・個別購入履歴などは保存しない。

## Step 4｜基準日の扱い

2026年9月15日時点を正確に復元できる場合だけ、9月15日Baselineを実数へ更新する。

復元できなければ：

`2026-09-15 = NOT_AVAILABLE`

を維持する。

最初に実数を取得できた日時を、別の `OBSERVED_AT` として追加する。

後日取得値を9月15日に遡及代入しない。

## Step 5｜更新対象

以下を更新する。

- `06_AUDIT/note_revenue_routing_2026-09-15.csv`
- `06_AUDIT/note_revenue_routing_report_2026-09-15.md`
- `06_AUDIT/note_revenue_phase04_baseline_2026-09-15.csv`
- `06_AUDIT/note_revenue_phase04_status_2026-09-15.md`

Phase04は既にACTIVEなので、再開始処理は不要。

## Step 6｜やらないこと

復旧直後に以下を行わない。

- PRIORITY_A残り記事へのCTA大量追加
- PRIORITY_BへのCTA追加
- P100候補既存記事の修正
- P1500 Deep Case修正
- 新商品公開
- 価格変更
- メンバーシップ開始

## 終了条件

1. n41ff修復・公開確認
2. routing台帳更新
3. 売上集計値取得、または取得不能理由を確定
4. baseline更新
5. Phase04 status更新

最終報告だけを返す。
