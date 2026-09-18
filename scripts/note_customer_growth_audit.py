#!/usr/bin/env python3
"""Audit a Phase01 delta CSV or the Phase02 full customer-note ledger.

P0 is limited to observed, mechanically verifiable failures. Similarity,
content role, customer intent, and causality remain review candidates.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

from note_customer_growth_lib import clean, duplicate_candidates, read_csv


OK_PUBLIC = {"PUBLIC", "公開", "OK"}
ALLOWED_UNCERTAINTY = {"", "NA", "VERIFIED_EXISTING", "UNKNOWN"}


def audit(
    rows: list[dict[str, str]],
    edge_rows: list[dict[str, str]],
    near_title_threshold: float,
    intent_threshold: float,
) -> dict:
    issues: dict[str, list[dict[str, str]]] = {"P0": [], "P1": [], "P2": []}

    def add(priority: str, article_id: str, code: str, detail: str) -> None:
        issues[priority].append(
            {"article_id": article_id or "-", "code": code, "detail": detail}
        )

    ids = [clean(row.get("article_id")) for row in rows]
    urls = [clean(row.get("url")) for row in rows]
    for value, count in Counter(ids).items():
        if value and count > 1:
            add("P0", value, "DUPLICATE_ARTICLE_ID", f"count={count}")
    for value, count in Counter(urls).items():
        if value and count > 1:
            add("P0", "-", "DUPLICATE_URL", value)

    duplicates = duplicate_candidates(rows, near_title_threshold, intent_threshold)
    for item in duplicates["exact"]:
        add("P0", "/".join(item["article_ids"]), "EXACT_DUPLICATE_TITLE", item["title"])
    for item in duplicates["near"]:
        add("P2", f"{item['left']}/{item['right']}", "NEAR_TITLE_REVIEW", f"score={item['score']}")
    for item in duplicates["intent"]:
        add(
            "P2",
            f"{item['left']}/{item['right']}",
            "SEARCH_INTENT_OVERLAP_CANDIDATE",
            f"score={item['score']}",
        )

    for row in rows:
        article_id = clean(row.get("article_id"))
        legacy_links = " ".join(
            clean(row.get(field_name))
            for field_name in ("internal_links", "external_links", "line_url")
        )
        public = clean(row.get("live_status")) or clean(row.get("public_status"))
        if public and public not in OK_PUBLIC:
            add("P0", article_id, "NOT_PUBLIC", public)
        if clean(row.get("lifekarte_direct_flag")) == "YES":
            add("P0", article_id, "DIRECT_LIFEKARTE", "public body contains a direct link")
        elif "lifekarte" in legacy_links.casefold():
            add("P0", article_id, "DIRECT_LIFEKARTE", "delta CSV contains a direct link")
        if "BROKEN" in clean(row.get("link_status")).upper():
            add("P0", article_id, "BROKEN_LINK", clean(row.get("link_status")))

        if clean(row.get("old_line_flag")) == "YES":
            add("P1", article_id, "OLD_LINE", "old LINE identifier observed")
        elif "hX5uJxc" in legacy_links:
            add("P1", article_id, "OLD_LINE", "old LINE identifier observed in delta CSV")
        if clean(row.get("brand_flags")) not in {"", "NONE"}:
            add("P2", article_id, "BRAND_REVIEW", clean(row.get("brand_flags")))
        if clean(row.get("internal_utm_violation_count")) not in {"", "0"}:
            add(
                "P2",
                article_id,
                "INTERNAL_UTM_CONTAMINATION",
                clean(row.get("internal_utm_violation_count")),
            )
        elif "utm_source=chatgpt.com" in clean(row.get("internal_links")):
            add("P2", article_id, "INTERNAL_UTM_CONTAMINATION", "delta CSV note link")
        if clean(row.get("official_utm_violation_count")) not in {"", "0"}:
            add(
                "P2",
                article_id,
                "OFFICIAL_UTM_REVIEW",
                clean(row.get("official_utm_violation_count")),
            )
        if clean(row.get("ambiguous_anchor_count")) not in {"", "0"}:
            add(
                "P1",
                article_id,
                "AMBIGUOUS_ANCHOR",
                clean(row.get("ambiguous_anchor_count")),
            )
        if clean(row.get("isolated_graph")) == "YES":
            add("P2", article_id, "ISOLATED", "incoming=0 and outgoing=0")
        if "SEARCH_EXPOSURE_WITHOUT_ACTION" in clean(row.get("priority_reasons")):
            add("P1", article_id, "SEARCH_EXPOSURE_WITHOUT_ACTION", "observed exposure and no action path")

        for field_name in ("case_fact_status", "customer_reaction_status"):
            value = clean(row.get(field_name))
            if value not in ALLOWED_UNCERTAINTY:
                add("P0", article_id, "INVALID_EVIDENCE_STATUS", f"{field_name}={value}")
        for field_name in ("note_seen", "note_decisive", "new_visit_involvement"):
            if field_name in row and clean(row.get(field_name)) == "":
                add("P1", article_id, "EMPTY_UNKNOWN_FIELD", field_name)

        expected = {
            value.strip()
            for value in re.split(r"[;\n]", clean(row.get("expected_internal_links")))
            if value.strip()
        }
        actual = set(re.findall(r"note\.com/koichi_ikeda/n/(n[a-z0-9]+)", clean(row.get("internal_links")), re.I))
        for target in sorted(expected - actual):
            add("P1", article_id, "EXPECTED_INTERNAL_LINK_MISSING", target)

    if edge_rows:
        article_ids = set(ids)
        for edge in edge_rows:
            if clean(edge.get("source_article_id")) not in article_ids:
                add("P0", "-", "EDGE_SOURCE_MISSING", clean(edge.get("source_article_id")))
            if clean(edge.get("target_type")) == "NOTE_ARTICLE":
                target_id = clean(edge.get("target_article_id"))
                if target_id and target_id not in article_ids:
                    add("P1", clean(edge.get("source_article_id")), "LINKS_OUTSIDE_SNAPSHOT", target_id)
            if clean(edge.get("target_type")) == "LIFEKARTE":
                add("P0", clean(edge.get("source_article_id")), "DIRECT_LIFEKARTE", clean(edge.get("target_url")))

    for priority in issues:
        unique = {}
        for item in issues[priority]:
            key = (item["article_id"], item["code"], item["detail"])
            unique[key] = item
        issues[priority] = list(unique.values())

    return {
        "articles": len(rows),
        "edges": len(edge_rows),
        "duplicates": duplicates,
        "issues": issues,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--links", type=Path)
    parser.add_argument("--near-title-threshold", type=float, default=0.72)
    parser.add_argument("--intent-threshold", type=float, default=0.66)
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--fail-on-p0", action="store_true")
    args = parser.parse_args()

    rows = read_csv(args.csv_path)
    edge_rows = read_csv(args.links) if args.links else []
    result = audit(rows, edge_rows, args.near_title_threshold, args.intent_threshold)

    print(f"articles={result['articles']}")
    print(f"edges={result['edges']}")
    print(f"exact_duplicate_titles={len(result['duplicates']['exact'])}")
    print(f"near_title_candidates={len(result['duplicates']['near'])}")
    print(f"intent_overlap_candidates={len(result['duplicates']['intent'])}")
    for priority in ("P0", "P1", "P2"):
        print(f"{priority}={len(result['issues'][priority])}")
        for item in result["issues"][priority]:
            print(f"{priority}\t{item['article_id']}\t{item['code']}\t{item['detail']}")

    if args.json_output:
        args.json_output.write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    if args.fail_on_p0 and result["issues"]["P0"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
