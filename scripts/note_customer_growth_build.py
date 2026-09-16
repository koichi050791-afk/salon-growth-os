#!/usr/bin/env python3
"""Build the customer-note acquisition ledger and link graph from public facts.

Public note is the content source of truth. The generated ledger is a derived
operational projection. Unknown visits, reactions, search exposure, and causal
relationships remain UNKNOWN.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen

from note_customer_growth_lib import (
    article_id_from_url,
    brand_flags,
    clean,
    counts,
    cycle_components,
    duplicate_candidates,
    graph_metrics,
    link_type,
    parse_body,
    priority_band,
    priority_score,
    read_csv,
    read_json,
    role_for,
    shortest_path,
    source_strength,
    theme_for,
    utm_parts,
    write_csv,
    write_json,
)


ARTICLE_FIELDS = [
    "article_id",
    "published_at_jst",
    "title",
    "url",
    "live_status",
    "inventory_as_of_jst",
    "primary_theme",
    "theme_status",
    "primary_role",
    "secondary_roles",
    "role_status",
    "search_intent",
    "search_intent_status",
    "source_strength",
    "source_strength_status",
    "observed_cta_types",
    "recommended_primary_cta_candidate",
    "official_web_connection",
    "consultation_connection",
    "line_connection",
    "reservation_connection",
    "internal_out_count",
    "internal_in_count",
    "one_way_out_count",
    "isolated_graph",
    "path_to_official_web",
    "path_to_consultation",
    "path_to_line",
    "path_to_reservation",
    "reachable_sink_types",
    "brand_flags",
    "old_line_flag",
    "lifekarte_direct_flag",
    "internal_utm_violation_count",
    "official_utm_violation_count",
    "ambiguous_anchor_count",
    "case_fact_status",
    "customer_reaction_status",
    "note_seen",
    "note_decisive",
    "new_visit_involvement",
    "search_exposure",
    "discovery_value",
    "understanding_value",
    "decision_value",
    "learning_value",
    "ai_structure_coverage",
    "ai_structure_missing",
    "content_currentness",
    "staleness_status",
    "priority_score",
    "priority_band",
    "priority_reasons",
    "human_review_required",
    "legacy_registry_source",
]

EDGE_FIELDS = [
    "source_article_id",
    "source_url",
    "target_type",
    "target_article_id",
    "target_url",
    "anchor_text",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_status",
    "anchor_status",
]

PATH_FIELDS = [
    "theme",
    "entry_article_id",
    "judgment_article_id",
    "case_article_id",
    "bridge_article_id",
    "content_coverage_status",
    "live_link_status",
    "missing_stage",
    "consultation_path_from_entry",
]

GAP_FIELDS = [
    "theme",
    "search_before",
    "consideration",
    "failure_anxiety",
    "method_comparison",
    "actual_judgment",
    "post_treatment_change",
    "next_consultation",
    "missing_stages",
    "preferred_resolution_order",
    "status",
]

QUEUE_FIELDS = [
    "priority",
    "article_id",
    "current_state",
    "problem",
    "change_location",
    "change_candidate",
    "link_source",
    "link_target",
    "anchor_candidate",
    "utm",
    "reason",
    "verification",
    "decision_status",
]


def fetch_json(url: str) -> dict:
    request = Request(
        url,
        headers={
            "User-Agent": "salon-growth-os-note-audit/2.0",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_live_snapshot(creator: str) -> dict:
    summaries: list[dict] = []
    page = 1
    reported_total = None
    while True:
        payload = fetch_json(
            f"https://note.com/api/v2/creators/{creator}/contents?kind=note&page={page}"
        )["data"]
        reported_total = payload.get("totalCount", reported_total)
        summaries.extend(payload.get("contents", []))
        if payload.get("isLastPage"):
            break
        page += 1
        if page > 100:
            raise RuntimeError("note pagination exceeded safety limit")

    unique = {clean(item.get("key")): item for item in summaries if clean(item.get("key"))}
    details: list[dict] = []
    for index, article_id in enumerate(sorted(unique), start=1):
        payload = fetch_json(f"https://note.com/api/v3/notes/{article_id}")["data"]
        details.append(
            {
                "article_id": article_id,
                "title": clean(payload.get("name")),
                "url": clean(payload.get("note_url"))
                or f"https://note.com/{creator}/n/{article_id}",
                "published_at_jst": clean(payload.get("publish_at")),
                "status": "PUBLIC" if payload.get("is_published") else clean(payload.get("status")),
                "body_html": clean(payload.get("body")),
            }
        )
        print(f"fetched {index}/{len(unique)} {article_id}", file=sys.stderr)

    return {
        "creator": creator,
        "reported_total_count": reported_total,
        "retrieved_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "articles": sorted(details, key=lambda row: row["published_at_jst"]),
    }


def load_snapshot(args: argparse.Namespace, config: dict) -> dict:
    if args.snapshot_input:
        return read_json(args.snapshot_input)
    snapshot = fetch_live_snapshot(config["creator"])
    if args.snapshot_output:
        write_json(args.snapshot_output, snapshot)
    return snapshot


def legacy_index(path: Path | None) -> dict[str, dict[str, str]]:
    if not path:
        return {}
    rows = read_csv(path)
    return {
        article_id_from_url(clean(row.get("url"))): row
        for row in rows
        if article_id_from_url(clean(row.get("url")))
    }


def observed_link_summary(edge_rows: list[dict[str, str]]) -> dict[str, dict[str, object]]:
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in edge_rows:
        grouped[clean(row.get("source_article_id"))].append(row)

    result: dict[str, dict[str, object]] = {}
    for article_id, rows in grouped.items():
        types = {clean(row.get("target_type")) for row in rows}
        result[article_id] = {
            "observed_cta_types": ";".join(sorted(types)) or "NONE",
            "official_web_connection": "YES" if "OFFICIAL_WEB" in types else "NO",
            "consultation_connection": "YES" if "CONSULTATION" in types else "NO",
            "line_connection": "YES" if "LINE" in types else "NO",
            "reservation_connection": "YES" if "RESERVATION" in types else "NO",
            "old_line_flag": "YES"
            if any("hX5uJxc" in clean(row.get("target_url")) for row in rows)
            else "NO",
            "lifekarte_direct_flag": "YES" if "LIFEKARTE" in types else "NO",
            "internal_utm_violation_count": sum(
                1
                for row in rows
                if clean(row.get("target_type")) == "NOTE_ARTICLE"
                and any(
                    clean(row.get(field_name))
                    for field_name in ("utm_source", "utm_medium", "utm_campaign")
                )
            ),
            "official_utm_violation_count": sum(
                1
                for row in rows
                if clean(row.get("target_type")) == "OFFICIAL_WEB"
                and clean(row.get("utm_status")) != "OK"
            ),
            "ambiguous_anchor_count": sum(
                1 for row in rows if clean(row.get("anchor_status")) == "AMBIGUOUS"
            ),
        }
    return result


def recommended_cta(role: str, theme: str) -> str:
    campaign = {
        "CEP1_CHANGE_WITHOUT_FAILURE": "change_without_failure",
        "CEP2_GRAY_HAIR_NOT_DARK": "gray_hair_not_dark",
        "CEP3_FRIZZ_DECISION": "frizz_decision",
        "CEP4_SHORT_HAIR_ANXIETY": "short_hair_anxiety",
        "CEP5_LIGHT_NOT_THIN": "light_not_thin",
        "CEP6_COLOR_DECISION_CANDIDATE": "color_decision",
        "CEP7_CARE_SCALP_CANDIDATE": "care_scalp",
    }.get(theme, "preconsult_bridge")
    if role == "A_ENTRY":
        return "RELATED_JUDGMENT_ARTICLE"
    if role == "B_JUDGMENT":
        return "RELATED_CASE_OR_PRECONSULT"
    if role == "C_CASE":
        return f"PRECONSULT?utm_source=note&utm_medium=article&utm_campaign={campaign}"
    return f"PRECONSULT?utm_source=note&utm_medium=article&utm_campaign={campaign}"


def value_flags(role: str, search_exposure: str, source_level: str) -> tuple[str, str, str, str]:
    discovery = "CONFIRMED" if search_exposure.startswith("CONFIRMED") else (
        "PARTIAL" if search_exposure.startswith("PARTIAL") else "UNKNOWN"
    )
    understanding = "SUPPORTED" if role in {"B_JUDGMENT", "C_CASE"} else "POTENTIAL"
    decision = "POTENTIAL" if role in {"B_JUDGMENT", "C_CASE", "D_BRIDGE"} else "UNKNOWN"
    learning = "POTENTIAL" if source_level == "A_ACTUAL_CASE" else "UNKNOWN"
    return discovery, understanding, decision, learning


def ai_structure(text: str, has_next_step: bool, verified_case: bool) -> tuple[str, str]:
    checks = {
        "AUDIENCE": bool(re.search(r"方へ|方に|相談", text)),
        "CONCERN": bool(re.search(r"悩|気にな|困|迷", text)),
        "CHECKS": bool(re.search(r"確認|見る|状態|履歴", text)),
        "JUDGMENT_BRANCH": bool(re.search(r"場合|一方|によって|分け", text)),
        "NOT_DO": bool(re.search(r"しない|しません|必要とは限|やらない", text)),
        "ACTUAL_CASE": verified_case,
        "NEXT_STEP": has_next_step,
    }
    present = sorted(name for name, value in checks.items() if value)
    missing = sorted(name for name, value in checks.items() if not value)
    return ";".join(present) or "NONE", ";".join(missing) or "NONE"


def build_edges(snapshot: dict, config: dict) -> tuple[list[dict[str, str]], dict[str, str]]:
    edges: list[dict[str, str]] = []
    body_texts: dict[str, str] = {}
    for article in snapshot["articles"]:
        article_id = clean(article.get("article_id"))
        body_text, links = parse_body(clean(article.get("body_html")))
        body_texts[article_id] = body_text
        for link in links:
            target_kind = link_type(link.href)
            target_id = article_id_from_url(link.href)
            source, medium, campaign = utm_parts(link.href)
            if target_kind == "NOTE_ARTICLE":
                utm_status = "OK" if not any((source, medium, campaign)) else "INTERNAL_UTM_REMOVE"
            elif target_kind == "OFFICIAL_WEB":
                expected_campaigns = set(config["utm"]["campaigns"].values())
                utm_status = (
                    "OK"
                    if source == config["utm"]["source"]
                    and medium == config["utm"]["medium"]
                    and campaign in expected_campaigns
                    else "REVIEW"
                )
            else:
                utm_status = "NOT_APPLICABLE"
            anchor_normalized = clean(link.anchor_text).replace(" ", "")
            anchor_status = (
                "AMBIGUOUS"
                if anchor_normalized in {"こちら", "ここ", "ということです。", "詳しくはこちら"}
                else "OK"
            )
            edges.append(
                {
                    "source_article_id": article_id,
                    "source_url": clean(article.get("url")),
                    "target_type": target_kind,
                    "target_article_id": target_id,
                    "target_url": link.href,
                    "anchor_text": clean(link.anchor_text) or "EMPTY",
                    "utm_source": source,
                    "utm_medium": medium,
                    "utm_campaign": campaign,
                    "utm_status": utm_status,
                    "anchor_status": anchor_status,
                }
            )
    return edges, body_texts


def build_articles(
    snapshot: dict,
    config: dict,
    legacy: dict[str, dict[str, str]],
    edge_rows: list[dict[str, str]],
    body_texts: dict[str, str],
    as_of: str,
) -> list[dict[str, object]]:
    article_ids = {clean(article.get("article_id")) for article in snapshot["articles"]}
    graph = graph_metrics(article_ids, edge_rows)
    link_summary = observed_link_summary(edge_rows)
    result: list[dict[str, object]] = []

    for article in snapshot["articles"]:
        article_id = clean(article.get("article_id"))
        title = clean(article.get("title"))
        legacy_row = legacy.get(article_id, {})
        overrides = config.get("article_overrides", {}).get(article_id, {})
        theme, theme_status = theme_for(title, clean(legacy_row.get("theme_cluster")), overrides)
        role, role_status = role_for(title, clean(legacy_row.get("content_role")), overrides)
        source_level, source_status = source_strength(role, role_status)
        links = link_summary.get(article_id, {})
        metrics = graph[article_id]
        search_exposure = config.get("search_exposure", {}).get(article_id, "UNKNOWN")
        body_flags = brand_flags(body_texts.get(article_id, ""), config)
        title_flags = brand_flags(title, config)
        all_flags = sorted(set(body_flags + title_flags))
        discovery, understanding, decision, learning = value_flags(
            role, search_exposure, source_level
        )
        structure_present, structure_missing = ai_structure(
            f"{title} {body_texts.get(article_id, '')}",
            has_next_step=clean(links.get("observed_cta_types")) not in {"", "NONE"},
            verified_case=role == "C_CASE" and role_status == "LEGACY_REGISTRY",
        )
        secondary: set[str] = set()
        if role != "A_ENTRY":
            secondary.add("A_ENTRY")
        if role != "D_BRIDGE" and any(
            clean(links.get(name)) == "YES"
            for name in (
                "official_web_connection",
                "consultation_connection",
                "line_connection",
                "reservation_connection",
            )
        ):
            secondary.add("D_BRIDGE")
        if role == "C_CASE":
            secondary.add("B_JUDGMENT")

        row: dict[str, object] = {
            "article_id": article_id,
            "published_at_jst": clean(article.get("published_at_jst")),
            "title": title,
            "url": clean(article.get("url")),
            "live_status": clean(article.get("status")) or "UNKNOWN",
            "inventory_as_of_jst": as_of,
            "primary_theme": theme,
            "theme_status": theme_status,
            "primary_role": role,
            "secondary_roles": ";".join(sorted(secondary)) or "NONE",
            "role_status": role_status,
            "search_intent": clean(overrides.get("search_intent")) or title,
            "search_intent_status": "CONFIG_REVIEWED" if overrides.get("search_intent") else "TITLE_PROXY",
            "source_strength": source_level,
            "source_strength_status": source_status,
            "observed_cta_types": clean(links.get("observed_cta_types")) or "NONE",
            "recommended_primary_cta_candidate": recommended_cta(role, theme),
            "brand_flags": ";".join(all_flags) or "NONE",
            "case_fact_status": "VERIFIED_EXISTING" if role == "C_CASE" else "UNKNOWN",
            "customer_reaction_status": "UNKNOWN",
            "note_seen": "UNKNOWN",
            "note_decisive": "UNKNOWN",
            "new_visit_involvement": "UNKNOWN",
            "search_exposure": search_exposure,
            "discovery_value": discovery,
            "understanding_value": understanding,
            "decision_value": decision,
            "learning_value": learning,
            "ai_structure_coverage": structure_present,
            "ai_structure_missing": structure_missing,
            "content_currentness": "PUBLIC_SNAPSHOT_ONLY",
            "staleness_status": "UNKNOWN",
            "human_review_required": "YES",
            "legacy_registry_source": (
                "ikeda-official-web/note_article_registry_2026-09-13.csv"
                if legacy_row
                else "NONE_NEW_LIVE_ARTICLE"
            ),
            **{
                "official_web_connection": clean(links.get("official_web_connection")) or "NO",
                "consultation_connection": clean(links.get("consultation_connection")) or "NO",
                "line_connection": clean(links.get("line_connection")) or "NO",
                "reservation_connection": clean(links.get("reservation_connection")) or "NO",
                "old_line_flag": clean(links.get("old_line_flag")) or "NO",
                "lifekarte_direct_flag": clean(links.get("lifekarte_direct_flag")) or "NO",
                "internal_utm_violation_count": clean(links.get("internal_utm_violation_count")) or "0",
                "official_utm_violation_count": clean(links.get("official_utm_violation_count")) or "0",
                "ambiguous_anchor_count": clean(links.get("ambiguous_anchor_count")) or "0",
            },
            **metrics,
        }
        score, reasons = priority_score(row)
        row["priority_score"] = score
        row["priority_band"] = priority_band(score)
        row["priority_reasons"] = ";".join(reasons) or "NONE"
        result.append(row)

    return sorted(result, key=lambda row: clean(row.get("published_at_jst")))


def live_link_exists(edges: list[dict[str, str]], source: str, target: str) -> bool:
    if source == target:
        return True
    return any(
        clean(edge.get("source_article_id")) == source
        and clean(edge.get("target_article_id")) == target
        for edge in edges
    )


def build_paths(config: dict, article_rows: list[dict[str, object]], edge_rows: list[dict[str, str]]) -> list[dict[str, object]]:
    article_ids = {clean(row.get("article_id")) for row in article_rows}
    paths: list[dict[str, object]] = []
    for path in config.get("theme_paths", []):
        entry = clean(path.get("entry"))
        judgment = clean(path.get("judgment"))
        case = clean(path.get("case"))
        bridge = clean(path.get("bridge"))
        stages = {"entry": entry, "judgment": judgment, "case": case, "bridge": bridge}
        missing = [name for name, article_id in stages.items() if article_id == "UNKNOWN" or article_id not in article_ids]
        link_checks = []
        if not missing:
            link_checks = [
                live_link_exists(edge_rows, entry, judgment),
                live_link_exists(edge_rows, judgment, case),
                live_link_exists(edge_rows, case, bridge),
            ]
        consultation_path = shortest_path(
            entry,
            article_ids,
            edge_rows,
            {"CONSULTATION", "OFFICIAL_WEB", "LINE", "RESERVATION"},
        )
        paths.append(
            {
                "theme": clean(path.get("theme")),
                "entry_article_id": entry,
                "judgment_article_id": judgment,
                "case_article_id": case,
                "bridge_article_id": bridge,
                "content_coverage_status": "COMPLETE" if not missing else "PARTIAL",
                "live_link_status": (
                    "COMPLETE" if link_checks and all(link_checks) else "PARTIAL_OR_NOT_IMPLEMENTED"
                ),
                "missing_stage": ";".join(missing) or "NONE",
                "consultation_path_from_entry": " -> ".join(consultation_path) or "NONE",
            }
        )
    return paths


def build_gap_matrix(config: dict, article_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    article_ids = {clean(row.get("article_id")) for row in article_rows}
    stages = (
        "search_before",
        "consideration",
        "failure_anxiety",
        "method_comparison",
        "actual_judgment",
        "post_treatment_change",
        "next_consultation",
    )
    result: list[dict[str, object]] = []
    for item in config.get("theme_gap_matrix", []):
        missing = [
            stage
            for stage in stages
            if clean(item.get(stage)) == "UNKNOWN" or clean(item.get(stage)) not in article_ids
        ]
        result.append(
            {
                "theme": clean(item.get("theme")),
                **{stage: clean(item.get(stage)) or "UNKNOWN" for stage in stages},
                "missing_stages": ";".join(missing) or "NONE",
                "preferred_resolution_order": (
                    "1_EXISTING_ARTICLE_ADDITION;2_CONNECT_EXISTING_ARTICLES;3_NEW_ARTICLE"
                ),
                "status": "COMPLETE" if not missing else "PARTIAL",
            }
        )
    return result


def build_queue(
    config: dict,
    article_rows: list[dict[str, object]],
    path_rows: list[dict[str, object]],
    gap_rows: list[dict[str, object]],
    edge_rows: list[dict[str, str]],
) -> list[dict[str, object]]:
    queue: list[dict[str, object]] = []
    for item in config.get("p1_work_items", []):
        queue.append({"priority": "P1", "decision_status": "CONFIRMED_QUEUE", **item})

    for path in path_rows:
        if clean(path.get("missing_stage")) == "NONE":
            continue
        queue.append(
            {
                "priority": "P2",
                "article_id": clean(path.get("theme")),
                "current_state": f"Theme path is missing: {clean(path.get('missing_stage'))}",
                "problem": "THEME_PATH_EVIDENCE_GAP",
                "change_location": "existing article registry and verified case evidence",
                "change_candidate": "First search existing verified cases and strengthen or connect an existing article; create a new article only if the documented daily gate passes.",
                "link_source": clean(path.get("entry_article_id")),
                "link_target": clean(path.get("bridge_article_id")),
                "anchor_candidate": "UNKNOWN_UNTIL_CASE_EXISTS",
                "utm": "utm_source=note&utm_medium=article&utm_campaign="
                + config["utm"]["campaigns"].get(clean(path.get("theme")), "other_review_required"),
                "reason": "Do not fabricate a case to make the funnel look complete.",
                "verification": "The selected case must have verified source evidence and the live article links must form entry -> judgment -> case -> bridge.",
                "decision_status": "HUMAN_REVIEW_REQUIRED",
            }
        )

    for gap in gap_rows:
        if clean(gap.get("missing_stages")) == "NONE":
            continue
        queue.append(
            {
                "priority": "P2",
                "article_id": clean(gap.get("theme")),
                "current_state": f"Customer-question stages are missing: {clean(gap.get('missing_stages'))}",
                "problem": "CUSTOMER_QUESTION_GAP",
                "change_location": "existing articles and verified field evidence",
                "change_candidate": "Resolve in order: add evidence-bounded content to an existing article, connect existing articles, then consider a new article only after the daily gate passes.",
                "link_source": "THEME_GAP_MATRIX",
                "link_target": "EXISTING_ARTICLE_FIRST",
                "anchor_candidate": "UNKNOWN_UNTIL_ARTICLE_IS_SELECTED",
                "utm": "FOLLOW_THEME_CAMPAIGN_ONLY_IF_LINKING_TO_OFFICIAL_WEB",
                "reason": "A gap is not permission to invent a customer question or treatment outcome.",
                "verification": "Update the gap matrix with a real article ID and source evidence; rerun the audit.",
                "decision_status": "HUMAN_REVIEW_REQUIRED",
            }
        )

    key_ids = {
        clean(path.get(field_name))
        for path in path_rows
        for field_name in ("entry_article_id", "judgment_article_id", "case_article_id", "bridge_article_id")
    }
    confirmed_problem_keys = {
        (clean(row.get("article_id")), clean(row.get("problem"))) for row in queue
    }
    for row in article_rows:
        article_id = clean(row.get("article_id"))
        reasons = clean(row.get("priority_reasons"))
        article_edges = [
            edge for edge in edge_rows if clean(edge.get("source_article_id")) == article_id
        ]
        if clean(row.get("old_line_flag")) == "YES" and article_id != "n5ffb8e639541":
            anchors = sorted(
                {
                    clean(edge.get("anchor_text"))
                    for edge in article_edges
                    if "hX5uJxc" in clean(edge.get("target_url"))
                }
            )
            queue.append(
                {
                    "priority": "P1",
                    "article_id": article_id,
                    "current_state": "Public body contains the old LINE identifier hX5uJxc.",
                    "problem": "OLD_LINE",
                    "change_location": "LINE links in the article body",
                    "change_candidate": "Replace only the destination with the current LINE URL; preserve factual article content.",
                    "link_source": article_id,
                    "link_target": "https://lin.ee/rG3y2px",
                    "anchor_candidate": ";".join(anchors) or "現在の公式LINEへ進む",
                    "utm": "NONE",
                    "reason": "The live full-inventory audit found an old identifier outside the five-row Phase01 delta.",
                    "verification": "Re-fetch the public body; hX5uJxc count=0 and rG3y2px is present where a LINE link remains.",
                    "decision_status": "OBSERVED_QUEUE",
                }
            )

        internal_utm_count = int(clean(row.get("internal_utm_violation_count")) or "0")
        if internal_utm_count and article_id not in {"n65308cfb33d5", "nc618049c3261"}:
            targets = sorted(
                {
                    clean(edge.get("target_article_id"))
                    for edge in article_edges
                    if clean(edge.get("utm_status")) == "INTERNAL_UTM_REMOVE"
                }
            )
            queue.append(
                {
                    "priority": "P2",
                    "article_id": article_id,
                    "current_state": f"{internal_utm_count} note-to-note links contain tracking parameters.",
                    "problem": "INTERNAL_UTM_CONTAMINATION",
                    "change_location": "note-to-note links in the article body",
                    "change_candidate": "Remove query parameters and retain canonical note article URLs.",
                    "link_source": article_id,
                    "link_target": ";".join(targets) or "ALL_NOTE_LINKS_IN_ARTICLE",
                    "anchor_candidate": "KEEP_EXISTING_MEANINGFUL_TEXT",
                    "utm": "NONE",
                    "reason": "Internal note links do not need acquisition tracking and chatgpt.com attribution is not an article source.",
                    "verification": "Re-fetch the public body; every note-to-note link has utm_status=OK.",
                    "decision_status": "OBSERVED_QUEUE",
                }
            )

        official_utm_count = int(clean(row.get("official_utm_violation_count")) or "0")
        if official_utm_count and article_id != "n4e9335e91aff":
            campaign = config["utm"]["campaigns"].get(
                clean(row.get("primary_theme")), "other_review_required"
            )
            target = next(
                (
                    clean(edge.get("target_url"))
                    for edge in article_edges
                    if clean(edge.get("target_type")) == "OFFICIAL_WEB"
                    and clean(edge.get("utm_status")) != "OK"
                ),
                "OFFICIAL_WEB_LINK_IN_ARTICLE",
            )
            queue.append(
                {
                    "priority": "P2",
                    "article_id": article_id,
                    "current_state": f"{official_utm_count} official-Web links do not follow the Phase02 UTM rule.",
                    "problem": "OFFICIAL_UTM_REVIEW",
                    "change_location": "official-Web link in the article body",
                    "change_candidate": "Add the standard note source, article medium, and theme campaign after compatibility review.",
                    "link_source": article_id,
                    "link_target": target,
                    "anchor_candidate": "KEEP_EXISTING_MEANINGFUL_TEXT",
                    "utm": f"utm_source=note&utm_medium=article&utm_campaign={campaign}",
                    "reason": "Standard attribution is required to compare theme routes without inventing per-URL names.",
                    "verification": "Re-fetch the public body; the official link has the standard source, medium, and approved campaign.",
                    "decision_status": "HUMAN_REVIEW_REQUIRED",
                }
            )

        if "SEARCH_EXPOSURE_WITHOUT_ACTION" in reasons:
            problem = "SEARCH_EXPOSURE_WITHOUT_ACTION"
            if (article_id, problem) not in confirmed_problem_keys:
                queue.append(
                    {
                        "priority": "P1",
                        "article_id": article_id,
                        "current_state": "Search exposure was recorded, but the public-body graph has no path to official Web, consultation, LINE, or reservation.",
                        "problem": problem,
                        "change_location": "one primary next-step section",
                        "change_candidate": clean(row.get("recommended_primary_cta_candidate")),
                        "link_source": article_id,
                        "link_target": "TO_BE_SELECTED_FROM_VERIFIED_THEME_PATH",
                        "anchor_candidate": "HUMAN_REVIEW_REQUIRED",
                        "utm": "FOLLOW_PHASE02_UTM_RULE",
                        "reason": "This is the highest-priority structural gap: observed discovery without a next action.",
                        "verification": "Re-fetch the public article, rerun graph audit, and later observe the relevant event without inferring a visit.",
                        "decision_status": "AUTO_CANDIDATE",
                    }
                )

        if article_id in key_ids and clean(row.get("isolated_graph")) == "YES":
            queue.append(
                {
                    "priority": "P2",
                    "article_id": article_id,
                    "current_state": "The article has no incoming or outgoing note-article edge in the public body.",
                    "problem": "KEY_PATH_ARTICLE_ISOLATED",
                    "change_location": "related-reading section",
                    "change_candidate": "Connect only to the verified next stage in the same theme path.",
                    "link_source": article_id,
                    "link_target": "VERIFIED_NEXT_STAGE_FROM_THEME_PATH",
                    "anchor_candidate": "DESCRIBE_THE_NEXT_QUESTION",
                    "utm": "NONE_FOR_NOTE_TO_NOTE",
                    "reason": "A selected path node should not depend on profile navigation alone.",
                    "verification": "Re-fetch the public body and confirm at least one relevant note edge without forcing a different search intent.",
                    "decision_status": "AUTO_CANDIDATE",
                }
            )
    return queue


def queue_dedupe(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    seen: set[tuple[str, str]] = set()
    result = []
    for row in rows:
        key = (clean(row.get("article_id")), clean(row.get("problem")))
        if key in seen:
            continue
        seen.add(key)
        result.append(row)
    return result


def render_report(
    config: dict,
    snapshot: dict,
    article_rows: list[dict[str, object]],
    edge_rows: list[dict[str, str]],
    path_rows: list[dict[str, object]],
    gap_rows: list[dict[str, object]],
    queue_rows: list[dict[str, object]],
    duplicates: dict,
    as_of: str,
) -> str:
    role_counts = counts(article_rows, "primary_role")
    theme_counts = counts(article_rows, "primary_theme")
    isolated = sum(clean(row.get("isolated_graph")) == "YES" for row in article_rows)
    article_ids = {clean(row.get("article_id")) for row in article_rows}
    article_by_id = {clean(row.get("article_id")): row for row in article_rows}
    internal_edges = sum(clean(row.get("target_type")) == "NOTE_ARTICLE" for row in edge_rows)
    one_way_edges = sum(int(clean(row.get("one_way_out_count")) or "0") for row in article_rows)
    cycles = cycle_components(article_ids, edge_rows)
    cycles_without_action = [
        component
        for component in cycles
        if all(clean(article_by_id[article_id].get("reachable_sink_types")) == "NONE" for article_id in component)
    ]
    hubs = sorted(
        article_rows,
        key=lambda row: int(clean(row.get("internal_in_count")) or "0"),
        reverse=True,
    )[:5]
    max_hub_share = (
        int(clean(hubs[0].get("internal_in_count")) or "0") / internal_edges
        if hubs and internal_edges
        else 0
    )
    direct_lifekarte = sum(clean(row.get("lifekarte_direct_flag")) == "YES" for row in article_rows)
    old_line = sum(clean(row.get("old_line_flag")) == "YES" for row in article_rows)
    p0 = direct_lifekarte + len(duplicates["exact"]) + sum(
        clean(row.get("live_status")) != "PUBLIC" for row in article_rows
    )
    confirmed_queue = sum(
        clean(row.get("decision_status")) in {"CONFIRMED_QUEUE", "OBSERVED_QUEUE"}
        and clean(row.get("priority")) == "P1"
        for row in queue_rows
    )
    live_count = len(article_rows)
    phase01_count = config["inventory_policy"]["phase01_reported_count"]
    lines = [
        "# 顧客向けnote 集客増加 Phase02 統合監査",
        "",
        f"監査日（JST）: {as_of}",
        "",
        "## 1. 結論",
        "",
        f"- 公開note APIの現在値は **{live_count}記事**。Phase01指示書の{phase01_count}記事は時点値であり、毎日更新により固定件数ではなくなっている。",
        f"- 公開API reported_total_count: {snapshot.get('reported_total_count', 'UNKNOWN')}。台帳はunique article_idで{live_count}件。",
        "- 本台帳は公開記事の派生運用投影。記事本文の正本はnote、顧客・来店・因果の未確認値はUNKNOWN。",
        f"- 機械検査P0: **{p0}**（公開失敗、完全同一タイトル、LifeKarte直リンクのみ）。リンク先HTTP到達性と実来店は別途UNKNOWN。",
        f"- 確定P1作業: **{confirmed_queue}件**。自動候補はHuman Reviewなしに公開変更へ進めない。",
        "",
        "## 2. PR #66再検証で判明したこと",
        "",
        "PR #66の従来監査は変更4記事＋影響1記事の5行だけを対象にしていた。そのため、従来のP0=0・近似タイトル0は全記事結論ではなかった。Phase02では公開API全件を再取得し、記事ID・本文リンク・アンカーテキストから再計算する。",
        "",
        "## 3. 記事役割",
        "",
    ]
    for key in ("A_ENTRY", "B_JUDGMENT", "C_CASE", "D_BRIDGE", "UNKNOWN"):
        lines.append(f"- {key}: {role_counts.get(key, 0)}")
    lines.extend(["", "主要テーマ:"])
    for key, value in sorted(theme_counts.items()):
        lines.append(f"- {key}: {value}")
    lines.extend(
        [
            "",
            "役割は既存70記事台帳を優先し、新規記事のみ明示ルールで候補化した。役割は運用分類であり、顧客事実や来店効果の認定ではない。",
            "",
            "## 4. 内部リンクグラフ",
            "",
            f"- 記事間・外部導線edge: {len(edge_rows)}",
            f"- note記事間edge: {internal_edges}",
            f"- 孤立記事: {isolated}",
            f"- 一方向note edge: {one_way_edges}",
            f"- 2記事以上の循環component: {len(cycles)}（行動導線なし: {len(cycles_without_action)}）",
            f"- 最大incoming集中率: {max_hub_share:.1%}（全note edge比）",
            f"- 旧LINEを含む記事: {old_line}",
            f"- LifeKarte直リンク記事: {direct_lifekarte}",
            "- path_to_* は本文リンクだけから計算。noteプロフィール導線やユーザーの記憶を暗黙の経路にしない。",
            "- 検索意図の異なる不自然な接続は機械確定せず、キューでHuman Reviewする。",
            "",
            "incoming上位: " + ", ".join(
                f"{clean(row.get('article_id'))}={clean(row.get('internal_in_count'))}" for row in hubs
            ),
            "",
            "## 5. 重複・カニバリ候補",
            "",
            f"- 完全同一タイトル: {len(duplicates['exact'])}組",
            f"- 近似タイトル候補: {len(duplicates['near'])}組",
            f"- 検索意図重複候補: {len(duplicates['intent'])}組",
            "- 候補は統合命令ではない。同じ人が同じ瞬間に同じ答えを求めるかをHuman Reviewする。",
            "",
            "## 6. 主要5テーマの最短経路",
            "",
            "|theme|content coverage|live links|missing|entryから行動導線|",
            "|---|---|---|---|---|",
        ]
    )
    for row in path_rows:
        lines.append(
            "|{theme}|{coverage}|{links}|{missing}|{path}|".format(
                theme=clean(row.get("theme")),
                coverage=clean(row.get("content_coverage_status")),
                links=clean(row.get("live_link_status")),
                missing=clean(row.get("missing_stage")),
                path=clean(row.get("consultation_path_from_entry")),
            )
        )
    lines.extend(
        [
            "",
            "ケースがUNKNOWNのテーマは、見栄えのために架空事例を補わない。既存の確認済み事例を探し、なければ実際の施術事例が生まれるまでPARTIALを維持する。",
            "",
            "## 7. 顧客の迷いの空白",
            "",
            "|theme|status|missing stages|解消順|",
            "|---|---|---|---|",
        ]
    )
    for row in gap_rows:
        lines.append(
            f"|{clean(row.get('theme'))}|{clean(row.get('status'))}|{clean(row.get('missing_stages'))}|既存追記 → 既存接続 → 新記事|"
        )
    lines.extend(
        [
            "",
            "各stageの記事IDはgap matrix CSVに保存した。UNKNOWNを新記事で即充足せず、実在証拠のある既存記事追記を先に検討する。",
            "",
            "## 8. 計測接続",
            "",
            "|段階|状態|根拠|",
            "|---|---|---|",
            "|検索→note|PARTIAL|一部記事の検索露出はPhase01記録で確認。全記事・継続順位はUNKNOWN。|",
            "|note→公式Web|PARTIAL|本文リンクは公開APIで確認できるが、GA4のnote_clickは期間内未観測。|",
            "|公式Web→相談|PARTIAL|consultation_click受信記録あり。個別note記事との連結はUNKNOWN。|",
            "|相談→LINE|UNKNOWN|line_clickは期間内未観測。|",
            "|LINE→予約|UNKNOWN|reservation_clickは期間内未観測。|",
            "|予約→新規来店|UNKNOWN|GA4で実来店を推測しない。|",
            "",
            "記事台帳は note_seen / note_decisive / new_visit_involvement を分離し、初期値をすべてUNKNOWNとした。",
            "",
            "## 9. 毎日更新",
            "",
            "`scripts/note_customer_growth_daily_gate.py` は、実際の相談・判断・今回はしなかったこと・出典が入力されない限り新記事候補を出さない。既存記事との近似が強い場合はUPDATE_EXISTING、経路不足ならADD_INTERNAL_LINKを優先する。判定は公開指示ではなく候補。",
            "",
            "## 10. 残る不確実性",
            "",
            "- 公開APIは記事本文とリンクの事実を示すが、検索順位、GA4受信、予約、実来店、選択理由を示さない。",
            "- 検索意図・一次情報強度・主CTAの自動分類は運用候補でありHuman Review対象。",
            "- link_statusのHTTP全件疎通、note実画面のスマートフォン表示、GA4 Realtime、BeautyMerit/LifeKarte内部は未確認。",
            "- Phase01の72記事という件数は現在値ではない。今後も固定件数を成功条件にしない。",
            "",
            "## 11. 正本ファイル",
            "",
            f"- `note_customer_growth_phase02_articles_{as_of}.csv`: 記事集客台帳",
            f"- `note_customer_growth_phase02_links_{as_of}.csv`: 記事間リンク構造",
            f"- `note_customer_growth_phase02_theme_paths_{as_of}.csv`: 主要5テーマ経路",
            f"- `note_customer_growth_phase02_theme_gap_matrix_{as_of}.csv`: 7段階の迷い・空白",
            f"- `note_customer_growth_phase02_queue_{as_of}.csv`: P1/P2変更指示",
            "- `note_customer_growth_phase02_rules.md`: UTM・来店接続・毎日更新・Human Gate",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--legacy-registry", type=Path)
    parser.add_argument("--snapshot-input", type=Path)
    parser.add_argument("--snapshot-output", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--as-of", required=True)
    args = parser.parse_args()

    config = read_json(args.config)
    snapshot = load_snapshot(args, config)
    legacy = legacy_index(args.legacy_registry)
    edge_rows, body_texts = build_edges(snapshot, config)
    article_rows = build_articles(snapshot, config, legacy, edge_rows, body_texts, args.as_of)
    path_rows = build_paths(config, article_rows, edge_rows)
    gap_rows = build_gap_matrix(config, article_rows)
    queue_rows = queue_dedupe(build_queue(config, article_rows, path_rows, gap_rows, edge_rows))
    thresholds = config["thresholds"]
    duplicates = duplicate_candidates(
        article_rows,
        near_title_threshold=float(thresholds["near_title"]),
        intent_threshold=float(thresholds["intent_overlap"]),
    )
    dispositions = config.get("cannibal_review_overrides", {})
    for group in ("near", "intent"):
        for candidate in duplicates[group]:
            pair = "|".join(sorted((clean(candidate.get("left")), clean(candidate.get("right")))))
            candidate["disposition"] = dispositions.get(pair, "HUMAN_REVIEW_REQUIRED")

    prefix = f"note_customer_growth_phase02_"
    output = args.output_dir
    write_csv(output / f"{prefix}articles_{args.as_of}.csv", article_rows, ARTICLE_FIELDS)
    write_csv(output / f"{prefix}links_{args.as_of}.csv", edge_rows, EDGE_FIELDS)
    write_csv(output / f"{prefix}theme_paths_{args.as_of}.csv", path_rows, PATH_FIELDS)
    write_csv(output / f"{prefix}theme_gap_matrix_{args.as_of}.csv", gap_rows, GAP_FIELDS)
    write_csv(output / f"{prefix}queue_{args.as_of}.csv", queue_rows, QUEUE_FIELDS)
    write_json(output / f"{prefix}duplicate_candidates_{args.as_of}.json", duplicates)
    report = render_report(
        config,
        snapshot,
        article_rows,
        edge_rows,
        path_rows,
        gap_rows,
        queue_rows,
        duplicates,
        args.as_of,
    )
    (output / f"{prefix}report_{args.as_of}.md").write_text(report, encoding="utf-8")

    print(f"articles={len(article_rows)}")
    print(f"edges={len(edge_rows)}")
    print(f"exact_duplicates={len(duplicates['exact'])}")
    print(f"near_title_candidates={len(duplicates['near'])}")
    print(f"intent_overlap_candidates={len(duplicates['intent'])}")
    print(f"queue={len(queue_rows)}")


if __name__ == "__main__":
    main()
