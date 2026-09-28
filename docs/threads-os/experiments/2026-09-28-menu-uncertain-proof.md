# Experiment｜2026-09-28｜menu-uncertain Proof

## 目的

「地域 × 実際の顧客の迷い × Decision」を使ったProof投稿から、
計測noteへの遷移が生まれるかを見る。

## 仮説

一般的な美容知識投稿より、
実際に出た「何を予約したらいいか分からなかった」という迷いを入口にした方が、
プロフィール・リンク・予約意向につながる可能性がある。

## 投稿予定構造

本文:
三田市のウッディタウンで美容師をしていること。
実際に「何を予約したらいいか分からなかった」と話した顧客がいたこと。
メニューを決めてから来店しなくてもよいというメッセージ。

コメント①:
悩みが複数あるとき、施術名を先に決めにくいこと。
「何が気になるか」「何を避けたいか」を先に整理するというDecision。

コメント②:
計測URL /go/threads/menu-uncertain/ から既存noteへ送る。

## API実行結果

Windsor.ai account:
38613328908314497 (@koichi_ikd)

create_text_post:
Published応答。
media id: 18632550100014189

create_reply コメント①:
Published応答。
media id: 17876684304562910

create_reply コメント②:
Fatal。

再試行:
ルート投稿へ → requested resource does not exist
コメント①へ → requested resource does not exist

read-back:
取得時点で新規本文がPosts一覧に出現せず。

## 判定

「API成功応答」は得たが「公開確認済み」ではない。

重複投稿を避けるため、追加の本文再投稿はしない。
同じエラーを無限再試行しない。

## 次回

公開面またはread connectorで投稿存在を確認できた場合のみ、
表示・プロフィール・threads_to_noteを追跡する。

存在確認できなければ、
Windsor.ai write/readの整合性問題として扱い、投稿内容の失敗とは扱わない。
