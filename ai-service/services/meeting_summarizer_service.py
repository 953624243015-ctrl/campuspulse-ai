"""
Meeting Summarizer Service
Extracts key points, decisions, action items, and deadlines from meeting notes.
Uses NLP patterns (no external LLM required; can integrate one when available).
"""

import re
from typing import List, Dict, Any


# Action item trigger phrases
ACTION_TRIGGERS = [
    r"\bwill\b", r"\bshould\b", r"\bmust\b", r"\bneed to\b", r"\bhas to\b",
    r"\baction:\b", r"\btask:\b", r"\bassign\b", r"\bresponsible\b",
    r"\bfollow[- ]?up\b", r"\bdeadline\b", r"\bby\s+\w+day\b",
    r"\bby\s+\d{1,2}/\d{1,2}\b",
]

DECISION_TRIGGERS = [
    r"\bdecided\b", r"\bagreed\b", r"\bapproved\b", r"\bresolved\b",
    r"\bconcluded\b", r"\bfinalised\b", r"\bfinalized\b",
]

DATE_PATTERN = re.compile(
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}|"
    r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})\b",
    re.IGNORECASE
)

PERSON_PATTERN = re.compile(
    r"\b(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)\b"
)


def summarize_meeting(text: str, meeting_id: str = "") -> Dict[str, Any]:
    """
    Extract structured information from meeting notes or transcript.
    Returns summary, key points, decisions, action items.
    """
    if not text or not text.strip():
        return {
            "error": "No text provided",
            "success": False,
        }

    lines = [l.strip() for l in text.split("\n") if l.strip()]
    sentences = _split_into_sentences(text)

    key_points = _extract_key_points(sentences)
    decisions = _extract_decisions(sentences)
    action_items = _extract_action_items(sentences)
    participants = _extract_participants(text)

    # Build summary (first 3 key points as prose)
    if key_points:
        summary_parts = key_points[:3]
        summary = " ".join(summary_parts)
        if len(summary) > 400:
            summary = summary[:400] + "..."
    else:
        summary = f"Meeting notes processed ({len(lines)} lines, {len(sentences)} statements)."

    return {
        "meeting_id": meeting_id,
        "summary": summary,
        "key_points": key_points[:8],
        "decisions": decisions[:6],
        "action_items": [
            {
                "id": i + 1,
                "description": item["text"],
                "assigned_to": item.get("person"),
                "due_date": item.get("date"),
                "priority": "high" if any(t in item["text"].lower() for t in ["urgent", "asap", "immediately"]) else "medium",
            }
            for i, item in enumerate(action_items[:10])
        ],
        "participants_mentioned": participants[:8],
        "stats": {
            "total_lines": len(lines),
            "decisions_count": len(decisions),
            "action_items_count": len(action_items),
        },
        "note": "Automated extraction — review and verify all action items and deadlines before distribution.",
        "success": True,
    }


# ── Private Helpers ──────────────────────────────────────────────────────────

def _split_into_sentences(text: str) -> List[str]:
    sentences = re.split(r"(?<=[.!?])\s+|(?<=\n)", text)
    return [s.strip() for s in sentences if len(s.strip()) > 15]


def _extract_key_points(sentences: List[str]) -> List[str]:
    """Extract sentences that seem like key discussion points."""
    key = []
    for s in sentences:
        sl = s.lower()
        if any(t in sl for t in ["discussed", "reviewed", "presented", "raised",
                                   "proposed", "suggested", "mentioned", "noted",
                                   "important", "key", "main"]):
            key.append(s)
    return key if key else sentences[:5]


def _extract_decisions(sentences: List[str]) -> List[str]:
    decisions = []
    for s in sentences:
        sl = s.lower()
        if any(re.search(p, sl) for p in DECISION_TRIGGERS):
            decisions.append(s)
    return decisions


def _extract_action_items(sentences: List[str]) -> List[Dict]:
    items = []
    for s in sentences:
        sl = s.lower()
        is_action = any(re.search(p, sl) for p in ACTION_TRIGGERS)
        if is_action:
            person_match = PERSON_PATTERN.search(s)
            date_match = DATE_PATTERN.search(s)
            items.append({
                "text": s,
                "person": person_match.group(0).strip() if person_match else None,
                "date": date_match.group(0).strip() if date_match else None,
            })
    return items


def _extract_participants(text: str) -> List[str]:
    matches = PERSON_PATTERN.findall(text)
    seen = set()
    result = []
    for m in matches:
        name = f"{m[0]} {m[1]}".strip() if m[0] else m[1]
        if name not in seen:
            seen.add(name)
            result.append(name)
    return result
