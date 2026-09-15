#!/usr/bin/env python3
"""
顧客向けnote集客監査。
CSV台帳を読み、主要5悩みの分類候補、同一タイトル、CTA欠落、ブランド表現候補を検査する。
顧客事実や施術判断は生成しない。分類結果は運用上の候補でありHuman Gate対象。
"""
from __future__ import annotations
import argparse
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

CEP_RULES = [
    ("CEP4_短くするのが怖い", [r"短く", r"ショート", r"ボブ"]),
    ("CEP2_白髪を暗くしたくない", [r"白髪", r"暗く", r"白髪染め", r"白髪ぼかし"]),
    ("CEP3_うねり・広がりの方法未定", [r"うねり", r"広が", r"縮毛矯正", r"髪質改善", r"まとまら"]),
    ("CEP5_軽くしたいがすかれたくない", [r"軽く", r"毛量", r"スカスカ", r"薄い", r"重い", r"レイヤー"]),
    ("CEP1_変えたいが失敗したくない", [r"変えたい", r"似合", r"失敗", r"不安", r"おまかせ", r"写真"]),
]
FORBIDDEN = [
    r"マイナス\s*[0-9０-９]+\s*歳",
    r"若返",
    r"若見え",
    r"老け見え",
    r"絶対",
    r"必ず",
    r"誰でも",
    r"一回で改善",
]
MISSING_CTA_VALUES = {"関連記事またはCTAなし", "", "なし", "不明"}


def text_of(row):
    return " ".join(str(row.get(k, "")) for k in (
        "title", "search_intent", "main_concern", "solved_problem", "next_question"
    ))


def classify(row):
    text = text_of(row)
    scores = []
    for label, patterns in CEP_RULES:
        score = sum(bool(re.search(pattern, text)) for pattern in patterns)
        scores.append((score, label))
    score, label = max(scores)
    return label if score else "OTHER"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path")
    args = parser.parse_args()
    path = Path(args.csv_path)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    titles = defaultdict(list)
    for row in rows:
        titles[row.get("title", "").strip()].append(row.get("article_id", ""))

    duplicates = {title: ids for title, ids in titles.items() if title and len(ids) > 1}
    forbidden_hits = []
    cta_missing = []
    counts = Counter()

    for row in rows:
        counts[classify(row)] += 1
        title = row.get("title", "")
        hits = [pattern for pattern in FORBIDDEN if re.search(pattern, title)]
        if hits:
            forbidden_hits.append((row.get("article_id", ""), title, hits))
        if row.get("current_cta", "").strip() in MISSING_CTA_VALUES:
            cta_missing.append((row.get("article_id", ""), title))

    print(f"articles={len(rows)}")
    print("\n[CEP counts]")
    for label, count in counts.most_common():
        print(f"{label}: {count}")

    print("\n[exact duplicate titles]")
    for title, ids in duplicates.items():
        print(f"{ids}: {title}")

    print("\n[brand expression candidates]")
    for item in forbidden_hits:
        print(item)

    print(f"\n[CTA missing candidates] {len(cta_missing)}")
    for article_id, title in cta_missing:
        print(f"{article_id}\t{title}")


if __name__ == "__main__":
    main()
