#!/usr/bin/env python3
from __future__ import annotations

import unittest

from note_customer_growth_audit import audit
from note_customer_growth_daily_gate import decide
from note_customer_growth_lib import (
    brand_flags,
    cycle_components,
    graph_metrics,
    intent_similarity,
    link_type,
    parse_body,
    utm_parts,
)


class NoteGrowthPhase02Test(unittest.TestCase):
    def test_parses_anchor_text_and_utm(self) -> None:
        body = (
            '<p><a href="https://ikeda-official-web.pages.dev/?utm_source=note&amp;'
            'utm_medium=article&amp;utm_campaign=frizz_decision">公式Webで整理する</a></p>'
        )
        text, links = parse_body(body)
        self.assertEqual(text, "公式Webで整理する")
        self.assertEqual(len(links), 1)
        self.assertEqual(link_type(links[0].href), "OFFICIAL_WEB")
        self.assertEqual(utm_parts(links[0].href), ("note", "article", "frizz_decision"))

    def test_graph_reaches_consultation_through_an_article(self) -> None:
        edges = [
            {
                "source_article_id": "na",
                "target_type": "NOTE_ARTICLE",
                "target_article_id": "nb",
            },
            {
                "source_article_id": "nb",
                "target_type": "CONSULTATION",
                "target_article_id": "",
            },
        ]
        metrics = graph_metrics({"na", "nb"}, edges)
        self.assertEqual(metrics["na"]["path_to_consultation"], "YES")
        self.assertEqual(metrics["nb"]["path_to_consultation"], "YES")

    def test_detects_note_cycle(self) -> None:
        edges = [
            {"source_article_id": "na", "target_type": "NOTE_ARTICLE", "target_article_id": "nb"},
            {"source_article_id": "nb", "target_type": "NOTE_ARTICLE", "target_article_id": "na"},
        ]
        self.assertEqual(cycle_components({"na", "nb"}, edges), [["na", "nb"]])

    def test_daily_gate_keeps_missing_evidence_on_hold(self) -> None:
        result = decide({"working_title": "軽くしたい"}, [])
        self.assertEqual(result["decision"], "HOLD_MISSING_EVIDENCE")
        self.assertIn("source_provenance", result["missing_fields"])

    def test_daily_gate_prefers_existing_article(self) -> None:
        articles = [
            {
                "article_id": "nexisting",
                "title": "軽くした後に髪が広がる理由",
                "search_intent": "軽くした後になぜ髪が広がるのか原因を理解する",
                "primary_theme": "CEP5_LIGHT_NOT_THIN",
            }
        ]
        payload = {
            "working_title": "髪を軽くした後に広がる理由",
            "source_provenance": "real consultation memo",
            "customer_question_or_observation": "軽くした後に広がった",
            "professional_judgment": "原因を分けて確認する",
            "search_intent": "軽くした後になぜ髪が広がるのか原因を理解する",
            "next_step": "既存記事を読む",
        }
        result = decide(payload, articles)
        self.assertEqual(result["decision"], "UPDATE_EXISTING")
        self.assertEqual(result["matched_article_id"], "nexisting")

    def test_audit_separates_p0_from_similarity_candidates(self) -> None:
        rows = [
            {
                "article_id": "na",
                "url": "https://note.com/koichi_ikeda/n/na",
                "title": "軽くした後に広がる理由",
                "search_intent": "原因を知る",
                "live_status": "PUBLIC",
                "lifekarte_direct_flag": "NO",
                "case_fact_status": "UNKNOWN",
                "customer_reaction_status": "UNKNOWN",
                "note_seen": "UNKNOWN",
                "note_decisive": "UNKNOWN",
                "new_visit_involvement": "UNKNOWN",
            },
            {
                "article_id": "nb",
                "url": "https://note.com/koichi_ikeda/n/nb",
                "title": "軽くしすぎて広がる髪の整え方",
                "search_intent": "回復方法を知る",
                "live_status": "PUBLIC",
                "lifekarte_direct_flag": "NO",
                "case_fact_status": "UNKNOWN",
                "customer_reaction_status": "UNKNOWN",
                "note_seen": "UNKNOWN",
                "note_decisive": "UNKNOWN",
                "new_visit_involvement": "UNKNOWN",
            },
        ]
        result = audit(rows, [], near_title_threshold=0.4, intent_threshold=0.4)
        self.assertEqual(result["issues"]["P0"], [])
        self.assertTrue(
            any(item["code"] == "NEAR_TITLE_REVIEW" for item in result["issues"]["P2"])
        )

    def test_intent_similarity_finds_same_topic_but_keeps_review_semantics(self) -> None:
        score = intent_similarity(
            "軽くした後になぜ髪が広がるのか原因を理解する",
            "すでに軽くしすぎて広がる状態からこれ以上減らさず整える",
        )
        self.assertGreaterEqual(score, 0.66)

    def test_negative_guarantee_is_not_flagged_as_overclaim(self) -> None:
        config = {"brand_patterns": {"OVERCLAIM": ["必ず"]}}
        flags = brand_flags("うねりがあっても、必ず縮毛矯正が必要というわけではありません。", config)
        self.assertEqual(flags, [])


if __name__ == "__main__":
    unittest.main()
