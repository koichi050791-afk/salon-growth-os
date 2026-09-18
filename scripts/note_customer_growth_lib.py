#!/usr/bin/env python3
"""Shared, evidence-bounded helpers for the customer note growth audit.

The module classifies operational roles and graph state. It never promotes a
customer statement, treatment result, visit, or causal claim into fact.
"""
from __future__ import annotations

import csv
import html
import json
import re
import unicodedata
from collections import Counter, defaultdict, deque
from dataclasses import dataclass
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, urlparse


NOTE_ID_RE = re.compile(r"note\.com/koichi_ikeda/n/(n[a-z0-9]+)", re.I)
ARTICLE_ID_RE = re.compile(r"^n[a-z0-9]+$", re.I)


def clean(value: object) -> str:
    return str(value or "").strip()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: Iterable[dict[str, object]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({field: clean(row.get(field, "")) for field in fields})


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def article_id_from_url(url: str) -> str:
    match = NOTE_ID_RE.search(url)
    return match.group(1) if match else ""


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", clean(value)).casefold()
    value = re.sub(r"【[^】]*】", "", value)
    return re.sub(r"[\s　｜|。、・「」『』（）()【】!?！？:：\-—〜~・]", "", value)


def similarity(left: str, right: str) -> float:
    left_norm = normalize_text(left)
    right_norm = normalize_text(right)
    if not left_norm or not right_norm:
        return 0.0
    return SequenceMatcher(None, left_norm, right_norm).ratio()


def split_terms(value: str) -> set[str]:
    normalized = unicodedata.normalize("NFKC", clean(value)).casefold()
    chunks = re.split(r"[\s　｜|。、・「」『』（）()【】!?！？:：\-—〜~]+", normalized)
    stop = {"三田市", "方へ", "美容室", "美容師", "考えたいこと", "確認したいこと"}
    return {part for part in chunks if len(part) >= 2 and part not in stop}


def concept_terms(value: str) -> set[str]:
    text = unicodedata.normalize("NFKC", clean(value)).casefold()
    concepts = {
        "GRAY": r"白髪|白髪染め|白髪ぼかし",
        "DARK": r"暗く|明るく",
        "FRIZZ": r"広が|まとまら|膨ら",
        "WAVE": r"うねり|くせ|クセ",
        "STRAIGHT": r"縮毛矯正|ストレート",
        "CARE": r"髪質改善|トリートメント|ケア|シャンプー|頭皮",
        "LIGHT": r"軽く|軽さ|量を減ら|毛量",
        "THIN": r"スカスカ|薄い|厚み",
        "LAYER": r"レイヤー",
        "SHORT": r"短く|ショート|ボブ",
        "CHANGE": r"変え|似合|印象|おまかせ",
        "COLOR": r"カラー|髪色|透明感|ベージュ",
        "CONSULT": r"相談|予約|メニュー",
        "FAILURE": r"失敗|不安|怖い",
    }
    return {name for name, pattern in concepts.items() if re.search(pattern, text, re.I)}


def intent_similarity(left: str, right: str) -> float:
    left_terms = split_terms(left)
    right_terms = split_terms(right)
    lexical = 0.0
    if left_terms and right_terms:
        lexical = len(left_terms & right_terms) / len(left_terms | right_terms)
    left_concepts = concept_terms(left)
    right_concepts = concept_terms(right)
    semantic = 0.0
    if left_concepts and right_concepts and len(left_concepts | right_concepts) >= 2:
        semantic = 0.75 * len(left_concepts & right_concepts) / len(left_concepts | right_concepts)
    return max(lexical, semantic, similarity(left, right) * 0.8)


@dataclass(frozen=True)
class Link:
    href: str
    anchor_text: str


class LinkTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[Link] = []
        self._active_href: str | None = None
        self._active_text: list[str] = []
        self.visible_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        attrs_map = {key.lower(): clean(value) for key, value in attrs}
        self._active_href = attrs_map.get("href", "")
        self._active_text = []

    def handle_data(self, data: str) -> None:
        text = clean(data)
        if not text:
            return
        self.visible_text.append(text)
        if self._active_href is not None:
            self._active_text.append(text)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._active_href is not None:
            self.links.append(
                Link(
                    href=html.unescape(self._active_href),
                    anchor_text=" ".join(self._active_text).strip(),
                )
            )
            self._active_href = None
            self._active_text = []


def parse_body(body_html: str) -> tuple[str, list[Link]]:
    parser = LinkTextParser()
    parser.feed(body_html or "")
    parser.close()
    return " ".join(parser.visible_text), parser.links


def link_type(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.casefold().removeprefix("www.")
    path = parsed.path.casefold()
    if NOTE_ID_RE.search(url):
        return "NOTE_ARTICLE"
    if host == "ikeda-official-web.pages.dev":
        return "OFFICIAL_WEB"
    if "ikeda-hair-consultation" in host:
        return "CONSULTATION"
    if host == "lin.ee":
        return "LINE"
    if "b-merit.jp" in host or "reserve" in path:
        return "RESERVATION"
    if "lifekarte" in host:
        return "LIFEKARTE"
    return "EXTERNAL"


def utm_parts(url: str) -> tuple[str, str, str]:
    query = parse_qs(urlparse(url).query)
    return (
        clean(query.get("utm_source", [""])[0]),
        clean(query.get("utm_medium", [""])[0]),
        clean(query.get("utm_campaign", [""])[0]),
    )


def theme_for(title: str, legacy_theme: str, overrides: dict) -> tuple[str, str]:
    article_id = clean(overrides.get("article_id"))
    if article_id:
        del article_id
    explicit = clean(overrides.get("primary_theme"))
    if explicit:
        return explicit, "CONFIG_OVERRIDE"

    text = unicodedata.normalize("NFKC", title)
    if re.search(r"短く|ショート|ボブ", text):
        return "CEP4_SHORT_HAIR_ANXIETY", "TITLE_RULE"
    if re.search(r"白髪|白髪染め|白髪ぼかし", text):
        return "CEP2_GRAY_HAIR_NOT_DARK", "TITLE_RULE"
    if re.search(r"頭皮|シャンプー|ホームケア", text):
        return "CEP7_CARE_SCALP_CANDIDATE", "TITLE_RULE_HUMAN_REVIEW"
    if re.search(r"透明感|カラー|髪色|ベージュ", text) and not re.search(r"白髪", text):
        return "CEP6_COLOR_DECISION_CANDIDATE", "TITLE_RULE_HUMAN_REVIEW"
    if re.search(r"うねり|広が|縮毛矯正|髪質改善|まとまら", text):
        return "CEP3_FRIZZ_DECISION", "TITLE_RULE"
    if re.search(r"軽く|毛量|スカスカ|薄い|重い|レイヤー", text):
        return "CEP5_LIGHT_NOT_THIN", "TITLE_RULE"
    if re.search(r"変え|似合|失敗|不安|おまかせ|写真|相談|間隔", text):
        return "CEP1_CHANGE_WITHOUT_FAILURE", "TITLE_RULE"

    fallback = {
        "CHANGE": "CEP1_CHANGE_WITHOUT_FAILURE",
        "GRAY": "CEP2_GRAY_HAIR_NOT_DARK",
        "CARE": "CEP3_FRIZZ_DECISION",
        "WEIGHT": "CEP5_LIGHT_NOT_THIN",
        "LAYER": "CEP5_LIGHT_NOT_THIN",
        "COLOR": "CEP6_COLOR_DECISION_CANDIDATE",
        "NAV": "CROSS_THEME_BRIDGE",
    }.get(legacy_theme, "OTHER")
    return fallback, "LEGACY_REGISTRY" if legacy_theme else "AUTO_CANDIDATE"


def role_for(title: str, legacy_role: str, overrides: dict) -> tuple[str, str]:
    explicit = clean(overrides.get("primary_role"))
    if explicit:
        return explicit, "CONFIG_OVERRIDE"
    mapped = {
        "GUIDE": "A_ENTRY",
        "DECISION": "B_JUDGMENT",
        "CASE": "C_CASE",
        "NAV": "D_BRIDGE",
    }.get(legacy_role)
    if mapped:
        return mapped, "LEGACY_REGISTRY"
    if "実際の相談ケース" in title:
        return "C_CASE", "TITLE_RULE"
    if re.search(r"公式Web|来店前相談|予約", title):
        return "D_BRIDGE", "TITLE_RULE"
    if re.search(r"理由|確認|判断|決め|選ぶ|考えて", title):
        return "B_JUDGMENT", "TITLE_RULE"
    return "A_ENTRY", "AUTO_CANDIDATE"


def source_strength(primary_role: str, role_status: str) -> tuple[str, str]:
    if primary_role == "C_CASE" and role_status == "LEGACY_REGISTRY":
        return "A_ACTUAL_CASE", "VERIFIED_EXISTING_REGISTRY"
    if primary_role == "B_JUDGMENT":
        return "B_PROFESSIONAL_JUDGMENT", "ARTICLE_TEXT_OPERATIONAL_CLASSIFICATION"
    return "D_GENERAL_EXPLANATION", "ARTICLE_TEXT_OPERATIONAL_CLASSIFICATION"


def brand_flags(text: str, config: dict) -> list[str]:
    hits: list[str] = []
    for group, patterns in config.get("brand_patterns", {}).items():
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.I):
                start = max(0, match.start() - 48)
                end = min(len(text), match.end() + 120)
                context = text[start:end]
                if group == "OVERCLAIM" and re.search(
                    r"必ずしも|とは限りません|わけではありません|必要はありません|施術ではありません|ということではありません|全員に必要とは限ら",
                    context,
                ):
                    continue
                if group == "MEDICAL_ASSERTION_CANDIDATE" and re.search(
                    r"診断する仕組みではなく|医療機関|治療では",
                    context,
                ):
                    continue
                hits.append(f"{group}:{pattern}")
    return sorted(set(hits))


def graph_metrics(article_ids: set[str], edge_rows: list[dict[str, str]]) -> dict[str, dict[str, object]]:
    outgoing: dict[str, set[str]] = defaultdict(set)
    incoming: dict[str, set[str]] = defaultdict(set)
    direct_sinks: dict[str, set[str]] = defaultdict(set)
    for edge in edge_rows:
        source = clean(edge.get("source_article_id"))
        target_id = clean(edge.get("target_article_id"))
        target_type = clean(edge.get("target_type"))
        if target_type == "NOTE_ARTICLE" and target_id in article_ids:
            outgoing[source].add(target_id)
            incoming[target_id].add(source)
        elif target_type in {"OFFICIAL_WEB", "CONSULTATION", "LINE", "RESERVATION"}:
            direct_sinks[source].add(target_type)

    reverse: dict[str, set[str]] = defaultdict(set)
    for source, targets in outgoing.items():
        for target in targets:
            reverse[target].add(source)

    reachable: dict[str, set[str]] = {article_id: set(direct_sinks[article_id]) for article_id in article_ids}
    changed = True
    while changed:
        changed = False
        for article_id in article_ids:
            before = len(reachable[article_id])
            for target in outgoing[article_id]:
                reachable[article_id].update(reachable[target])
            changed = changed or len(reachable[article_id]) != before

    metrics: dict[str, dict[str, object]] = {}
    for article_id in article_ids:
        metrics[article_id] = {
            "internal_out_count": len(outgoing[article_id]),
            "internal_in_count": len(incoming[article_id]),
            "isolated_graph": "YES" if not outgoing[article_id] and not incoming[article_id] else "NO",
            "one_way_out_count": sum(
                1 for target in outgoing[article_id] if article_id not in outgoing[target]
            ),
            "path_to_official_web": "YES" if "OFFICIAL_WEB" in reachable[article_id] else "NO",
            "path_to_consultation": "YES" if "CONSULTATION" in reachable[article_id] else "NO",
            "path_to_line": "YES" if "LINE" in reachable[article_id] else "NO",
            "path_to_reservation": "YES" if "RESERVATION" in reachable[article_id] else "NO",
            "reachable_sink_types": ";".join(sorted(reachable[article_id])) or "NONE",
        }
    return metrics


def shortest_path(
    start: str,
    article_ids: set[str],
    edge_rows: list[dict[str, str]],
    sink_types: set[str],
) -> list[str]:
    outgoing: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for edge in edge_rows:
        source = clean(edge.get("source_article_id"))
        target_type = clean(edge.get("target_type"))
        target_id = clean(edge.get("target_article_id"))
        if target_type == "NOTE_ARTICLE" and target_id in article_ids:
            outgoing[source].append((target_id, target_id))
        elif target_type in sink_types:
            outgoing[source].append((f"SINK:{target_type}", f"SINK:{target_type}"))

    queue = deque([(start, [start])])
    seen = {start}
    while queue:
        node, path = queue.popleft()
        for next_node, label in outgoing[node]:
            if next_node.startswith("SINK:"):
                return path + [label]
            if next_node not in seen:
                seen.add(next_node)
                queue.append((next_node, path + [next_node]))
    return []


def cycle_components(
    article_ids: set[str], edge_rows: list[dict[str, str]]
) -> list[list[str]]:
    """Return strongly connected note-article components with 2+ nodes."""
    outgoing: dict[str, set[str]] = defaultdict(set)
    for edge in edge_rows:
        source = clean(edge.get("source_article_id"))
        target = clean(edge.get("target_article_id"))
        if clean(edge.get("target_type")) == "NOTE_ARTICLE" and target in article_ids:
            outgoing[source].add(target)

    index = 0
    indexes: dict[str, int] = {}
    lowlinks: dict[str, int] = {}
    stack: list[str] = []
    on_stack: set[str] = set()
    components: list[list[str]] = []

    def visit(node: str) -> None:
        nonlocal index
        indexes[node] = index
        lowlinks[node] = index
        index += 1
        stack.append(node)
        on_stack.add(node)

        for target in outgoing[node]:
            if target not in indexes:
                visit(target)
                lowlinks[node] = min(lowlinks[node], lowlinks[target])
            elif target in on_stack:
                lowlinks[node] = min(lowlinks[node], indexes[target])

        if lowlinks[node] == indexes[node]:
            component: list[str] = []
            while stack:
                member = stack.pop()
                on_stack.remove(member)
                component.append(member)
                if member == node:
                    break
            if len(component) >= 2:
                components.append(sorted(component))

    for article_id in sorted(article_ids):
        if article_id not in indexes:
            visit(article_id)
    return sorted(components)


def duplicate_candidates(
    rows: list[dict[str, str]],
    near_title_threshold: float,
    intent_threshold: float,
) -> dict[str, list[dict[str, object]]]:
    exact_index: dict[str, list[str]] = defaultdict(list)
    for row in rows:
        exact_index[clean(row.get("title"))].append(clean(row.get("article_id")))
    exact = [
        {"title": title, "article_ids": ids}
        for title, ids in exact_index.items()
        if title and len(ids) > 1
    ]

    near: list[dict[str, object]] = []
    intent: list[dict[str, object]] = []
    for index, left in enumerate(rows):
        for right in rows[index + 1 :]:
            left_id = clean(left.get("article_id"))
            right_id = clean(right.get("article_id"))
            title_score = similarity(clean(left.get("title")), clean(right.get("title")))
            if title_score >= near_title_threshold:
                near.append({"left": left_id, "right": right_id, "score": round(title_score, 3)})
            intent_score = intent_similarity(
                clean(left.get("search_intent")) or clean(left.get("title")),
                clean(right.get("search_intent")) or clean(right.get("title")),
            )
            if intent_score >= intent_threshold:
                intent.append({"left": left_id, "right": right_id, "score": round(intent_score, 3)})
    return {"exact": exact, "near": near, "intent": intent}


def priority_score(row: dict[str, object]) -> tuple[int, list[str]]:
    score = 0
    reasons: list[str] = []

    def add(points: int, reason: str) -> None:
        nonlocal score
        score += points
        reasons.append(reason)

    if clean(row.get("lifekarte_direct_flag")) == "YES":
        add(100, "DIRECT_LIFEKARTE_P0")
    if clean(row.get("old_line_flag")) == "YES":
        add(25, "OLD_LINE")
    if clean(row.get("brand_flags")) not in {"", "NONE"}:
        add(20, "BRAND_REVIEW")
    if clean(row.get("internal_utm_violation_count")) not in {"", "0"}:
        add(15, "INTERNAL_UTM")
    no_action_path = all(
        clean(row.get(field_name)) == "NO"
        for field_name in ("path_to_official_web", "path_to_consultation", "path_to_line", "path_to_reservation")
    )
    if no_action_path:
        add(15, "NO_ACTION_PATH")
    if clean(row.get("isolated_graph")) == "YES":
        add(15, "ISOLATED")
    if clean(row.get("search_exposure")) == "CONFIRMED" and no_action_path:
        add(25, "SEARCH_EXPOSURE_WITHOUT_ACTION")
    if clean(row.get("primary_theme")) == "OTHER":
        add(5, "THEME_REVIEW")
    if clean(row.get("role_status")) == "AUTO_CANDIDATE":
        add(5, "ROLE_REVIEW")
    return score, reasons


def priority_band(score: int) -> str:
    if score >= 100:
        return "P0"
    if score >= 35:
        return "P1_CANDIDATE"
    if score >= 15:
        return "P2_CANDIDATE"
    return "OBSERVE"


def counts(rows: list[dict[str, str]], field_name: str) -> Counter:
    return Counter(clean(row.get(field_name)) or "UNKNOWN" for row in rows)
