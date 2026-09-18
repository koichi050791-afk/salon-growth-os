#!/usr/bin/env python3
"""Evidence-first daily decision gate for customer-facing note work.

The result is an operational candidate, never an instruction to publish.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from note_customer_growth_lib import clean, intent_similarity, read_csv, similarity


REQUIRED_EVIDENCE_FIELDS = (
    "source_provenance",
    "customer_question_or_observation",
    "professional_judgment",
    "search_intent",
    "next_step",
)


def decide(payload: dict, articles: list[dict[str, str]]) -> dict:
    missing = [field for field in REQUIRED_EVIDENCE_FIELDS if not clean(payload.get(field))]
    if missing:
        return {
            "decision": "HOLD_MISSING_EVIDENCE",
            "status": "HUMAN_REVIEW_REQUIRED",
            "missing_fields": missing,
            "matched_article_id": "UNKNOWN",
            "reason": "A new URL cannot be justified without real source provenance, a real question or observation, professional judgment, distinct intent, and a natural next step.",
        }

    title = clean(payload.get("working_title"))
    intent = clean(payload.get("search_intent"))
    comparisons = []
    for row in articles:
        comparisons.append(
            {
                "article_id": clean(row.get("article_id")),
                "title": clean(row.get("title")),
                "title_similarity": similarity(title, clean(row.get("title"))),
                "intent_similarity": intent_similarity(intent, clean(row.get("search_intent"))),
                "primary_theme": clean(row.get("primary_theme")),
            }
        )
    comparisons.sort(
        key=lambda row: max(row["title_similarity"], row["intent_similarity"]), reverse=True
    )
    best = comparisons[0] if comparisons else None

    if best and (best["title_similarity"] >= 0.72 or best["intent_similarity"] >= 0.66):
        return {
            "decision": "UPDATE_EXISTING",
            "status": "HUMAN_REVIEW_REQUIRED",
            "missing_fields": [],
            "matched_article_id": best["article_id"],
            "title_similarity": round(best["title_similarity"], 3),
            "intent_similarity": round(best["intent_similarity"], 3),
            "reason": "An existing article appears to answer the same question or intent. Strengthen the existing article before creating a new URL.",
        }

    related_case_id = clean(payload.get("verified_case_article_id"))
    if related_case_id and not any(clean(row.get("article_id")) == related_case_id for row in articles):
        return {
            "decision": "HOLD_UNVERIFIED_CASE_LINK",
            "status": "HUMAN_REVIEW_REQUIRED",
            "missing_fields": [],
            "matched_article_id": "UNKNOWN",
            "reason": "The stated case article is not present in the current live ledger. Do not create or imply a case connection.",
        }

    if clean(payload.get("existing_article_to_connect")):
        target = clean(payload.get("existing_article_to_connect"))
        if any(clean(row.get("article_id")) == target for row in articles):
            return {
                "decision": "ADD_INTERNAL_LINK",
                "status": "HUMAN_REVIEW_REQUIRED",
                "missing_fields": [],
                "matched_article_id": target,
                "reason": "The supplied evidence identifies a next-understanding gap that can be addressed by connecting existing content before creating a new URL.",
            }

    return {
        "decision": "NEW_ARTICLE_CANDIDATE",
        "status": "HUMAN_REVIEW_REQUIRED",
        "missing_fields": [],
        "matched_article_id": best["article_id"] if best else "NONE",
        "title_similarity": round(best["title_similarity"], 3) if best else 0,
        "intent_similarity": round(best["intent_similarity"], 3) if best else 0,
        "reason": "No strong same-intent match was found and the minimum evidence fields are present. Publication still requires a human check of facts, role, CTA, privacy, and brand wording.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--articles", type=Path, required=True)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    articles = read_csv(args.articles)
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    result = decide(payload, articles)
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")


if __name__ == "__main__":
    main()
