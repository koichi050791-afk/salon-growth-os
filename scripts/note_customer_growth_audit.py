#!/usr/bin/env python3
"""顧客向けnote集客の差分監査。

72記事を毎回読み直さず、変更記事と影響記事のCSVを対象に、タイトル競合、
CTA、内部リンク、ブランド表現、事実確認状態を再検査する。
顧客事実・施術判断・顧客反応は生成しない。
"""
from __future__ import annotations

import argparse
import csv
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path


CEP_RULES = [
    ("CEP4_短くするのが怖い", [r"短く", r"ショート", r"ボブ"]),
    ("CEP2_白髪を暗くしたくない", [r"白髪", r"暗く", r"白髪染め", r"白髪ぼかし"]),
    ("CEP3_うねり・広がりの方法未定", [r"うねり", r"広が", r"縮毛矯正", r"髪質改善", r"まとまら"]),
    ("CEP5_軽くしたいがすかれたくない", [r"軽く", r"毛量", r"スカスカ", r"薄い", r"重い", r"レイヤー"]),
    ("CEP1_変えたいが失敗したくない", [r"変えたい", r"似合", r"失敗", r"不安", r"おまかせ", r"写真"]),
]

AGE_ANXIETY = [
    r"マイナス\s*[0-9０-９]+\s*歳",
    r"若返",
    r"若見え",
    r"老け(?:て)?見え",
]
OVERCLAIMS = [r"絶対", r"必ず", r"誰でも", r"一回で改善"]
MISSING_CTA_VALUES = {"関連記事またはCTAなし", "", "なし", "不明", "UNKNOWN"}
OK_PUBLIC = {"PUBLIC", "公開", "OK"}
OLD_LINE_IDS = {"hX5uJxc"}
NOTE_ID = re.compile(r"note\.com/koichi_ikeda/n/(n[a-z0-9]+)", re.I)


def field(row: dict[str, str], name: str) -> str:
    return str(row.get(name, "") or "").strip()


def text_of(row: dict[str, str]) -> str:
    return " ".join(
        field(row, key)
        for key in (
            "title",
            "search_intent",
            "primary_concern",
            "main_concern",
            "solved_problem",
            "next_question",
            "body_text",
            "current_cta",
            "notes",
        )
    )


def normalize(value: str) -> str:
    value = value.casefold()
    value = re.sub(r"【[^】]*】", "", value)
    return re.sub(r"[\s　｜|。、・「」『』（）()【】!?！？:：\-—〜~]", "", value)


def similarity(a: str, b: str) -> float:
    a_norm, b_norm = normalize(a), normalize(b)
    if not a_norm or not b_norm:
        return 0.0
    return SequenceMatcher(None, a_norm, b_norm).ratio()


def split_values(value: str) -> list[str]:
    return [part.strip() for part in re.split(r"[;\n]", value) if part.strip()]


def classify(row: dict[str, str]) -> str:
    if field(row, "primary_concern"):
        return field(row, "primary_concern")
    text = text_of(row)
    scores = []
    for label, patterns in CEP_RULES:
        score = sum(bool(re.search(pattern, text)) for pattern in patterns)
        scores.append((score, label))
    score, label = max(scores)
    return label if score else "OTHER"


def add_issue(issues, priority: str, article_id: str, code: str, detail: str) -> None:
    issues[priority].append((article_id or "-", code, detail))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path")
    parser.add_argument("--near-title-threshold", type=float, default=0.72)
    parser.add_argument("--intent-threshold", type=float, default=0.78)
    args = parser.parse_args()

    path = Path(args.csv_path)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    titles: dict[str, list[str]] = defaultdict(list)
    rows_by_id = {}
    counts = Counter()
    issues: dict[str, list[tuple[str, str, str]]] = {"P0": [], "P1": [], "P2": []}

    for row in rows:
        article_id = field(row, "article_id")
        rows_by_id[article_id] = row
        title = field(row, "title")
        titles[title].append(article_id)
        counts[classify(row)] += 1

        if "public_status" in row and field(row, "public_status") not in OK_PUBLIC:
            add_issue(issues, "P0", article_id, "NOT_PUBLIC", field(row, "public_status") or "UNKNOWN")

        link_status = field(row, "link_status")
        if "BROKEN" in link_status.upper():
            add_issue(issues, "P0", article_id, "BROKEN_LINK", link_status)

        all_links = " ".join([field(row, "internal_links"), field(row, "external_links")])
        if re.search(r"https?://(?:www\.)?lifekarte\.com", all_links, re.I):
            add_issue(issues, "P0", article_id, "DIRECT_LIFEKARTE", "LifeKarte直リンク")

        content = text_of(row)
        age_hits = [pattern for pattern in AGE_ANXIETY if re.search(pattern, content)]
        if age_hits:
            add_issue(issues, "P1", article_id, "AGE_ANXIETY", ", ".join(age_hits))

        claim_hits = [pattern for pattern in OVERCLAIMS if re.search(pattern, content)]
        if claim_hits:
            add_issue(issues, "P1", article_id, "OVERCLAIM", ", ".join(claim_hits))

        cta = field(row, "current_cta")
        if cta in MISSING_CTA_VALUES:
            add_issue(issues, "P1", article_id, "CTA_MISSING", cta or "empty")
        cta_status = field(row, "cta_status")
        if cta_status and cta_status != "OK":
            add_issue(issues, "P1", article_id, "CTA_REVIEW", cta_status)

        old_line_hits = sorted(line_id for line_id in OLD_LINE_IDS if line_id in all_links)
        if old_line_hits:
            add_issue(issues, "P1", article_id, "OLD_LINE", ", ".join(old_line_hits))

        if "utm_source=chatgpt.com" in field(row, "internal_links"):
            add_issue(
                issues,
                "P1",
                article_id,
                "INTERNAL_UTM_CONTAMINATION",
                "note内部リンクにutm_source=chatgpt.com",
            )

        expected = split_values(field(row, "expected_internal_links"))
        actual_ids = set(NOTE_ID.findall(field(row, "internal_links")))
        missing_expected = [target for target in expected if target not in actual_ids]
        if missing_expected:
            add_issue(
                issues,
                "P1",
                article_id,
                "EXPECTED_INTERNAL_LINK_MISSING",
                ", ".join(missing_expected),
            )

        incoming = field(row, "incoming_internal_count")
        if incoming == "0" and not split_values(field(row, "internal_links")):
            add_issue(issues, "P1", article_id, "ORPHAN", "incoming=0 / outgoing=0")

        if "case_fact_status" in row and field(row, "case_fact_status") not in {
            "",
            "NA",
            "VERIFIED_EXISTING",
            "UNKNOWN",
        }:
            add_issue(issues, "P0", article_id, "CASE_FACT_UNVERIFIED", field(row, "case_fact_status"))
        if "customer_reaction_status" in row and field(row, "customer_reaction_status") not in {
            "",
            "NA",
            "VERIFIED_EXISTING",
            "UNKNOWN",
        }:
            add_issue(
                issues,
                "P0",
                article_id,
                "CUSTOMER_REACTION_UNVERIFIED",
                field(row, "customer_reaction_status"),
            )
        if field(row, "content_basis") == "KEYWORD_ONLY":
            add_issue(issues, "P1", article_id, "KEYWORD_ONLY_ARTICLE", "検索語差分のみ")

    duplicates = {title: ids for title, ids in titles.items() if title and len(ids) > 1}
    for title, ids in duplicates.items():
        for article_id in ids:
            add_issue(issues, "P0", article_id, "EXACT_DUPLICATE_TITLE", title)

    near_pairs = []
    intent_pairs = []
    for index, left in enumerate(rows):
        for right in rows[index + 1 :]:
            left_id, right_id = field(left, "article_id"), field(right, "article_id")
            score = similarity(field(left, "title"), field(right, "title"))
            if score >= args.near_title_threshold:
                near_pairs.append((left_id, right_id, score))
                add_issue(issues, "P1", f"{left_id}/{right_id}", "NEAR_TITLE", f"score={score:.2f}")

            intent_score = similarity(field(left, "search_intent"), field(right, "search_intent"))
            if intent_score >= args.intent_threshold:
                intent_pairs.append((left_id, right_id, intent_score))
                add_issue(
                    issues,
                    "P1",
                    f"{left_id}/{right_id}",
                    "SEARCH_INTENT_OVERLAP",
                    f"score={intent_score:.2f}",
                )

    for article_id, row in rows_by_id.items():
        outgoing = set(NOTE_ID.findall(field(row, "internal_links")))
        for target in outgoing & rows_by_id.keys():
            reverse = set(NOTE_ID.findall(field(rows_by_id[target], "internal_links")))
            if article_id not in reverse:
                add_issue(issues, "P1", f"{article_id}->{target}", "ONE_WAY_LINK", "逆リンクなし")

    if len(rows) >= 20:
        threshold = max(5, round(len(rows) * 0.35))
        for label, count in counts.items():
            if count > threshold:
                add_issue(issues, "P2", "-", "TOPIC_CONCENTRATION", f"{label}: {count}/{len(rows)}")

    print(f"articles={len(rows)}")
    print("\n[CEP counts]")
    for label, count in counts.most_common():
        print(f"{label}: {count}")

    print("\n[exact duplicate titles]")
    if not duplicates:
        print("none")
    for title, ids in duplicates.items():
        print(f"{ids}: {title}")

    print("\n[near title pairs]")
    if not near_pairs:
        print("none")
    for left_id, right_id, score in near_pairs:
        print(f"{left_id}\t{right_id}\t{score:.2f}")

    print("\n[search intent overlap pairs]")
    if not intent_pairs:
        print("none")
    for left_id, right_id, score in intent_pairs:
        print(f"{left_id}\t{right_id}\t{score:.2f}")

    print("\n[priority issues]")
    for priority in ("P0", "P1", "P2"):
        print(f"{priority}={len(issues[priority])}")
        for article_id, code, detail in issues[priority]:
            print(f"{priority}\t{article_id}\t{code}\t{detail}")


if __name__ == "__main__":
    main()
