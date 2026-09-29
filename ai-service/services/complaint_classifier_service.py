"""
Complaint Classification Service
Uses keyword/rule-based classification with confidence scoring.
Falls back gracefully if no keywords match.
"""

import re
from typing import Tuple

# Category mapping: (category_code, keywords)
CATEGORY_RULES = [
    ("WIFI",      ["wifi", "wi-fi", "internet", "network", "connectivity", "broadband", "router", "signal"]),
    ("ELECTRICAL",["electricity", "power", "electrical", "voltage", "short circuit", "light", "fan",
                   "ac", "air conditioner", "plug", "socket", "trip", "mcb", "fuse"]),
    ("CLASSROOM", ["classroom", "bench", "chair", "table", "whiteboard", "projector", "board",
                   "marker", "chalk", "door", "window", "lock", "broken"]),
    ("LAB",       ["lab", "computer", "pc", "monitor", "keyboard", "mouse", "printer",
                   "equipment", "instrument", "workstation"]),
    ("WATER",     ["water", "tap", "pipe", "leak", "drinking", "restroom", "toilet",
                   "bathroom", "flush", "plumbing", "drainage"]),
    ("CLEAN",     ["clean", "dirty", "garbage", "waste", "smell", "hygiene", "sweep",
                   "mop", "cafeteria", "mess", "toilet", "dust"]),
    ("TRANSPORT", ["bus", "transport", "vehicle", "driver", "route", "stop", "late",
                   "timing", "delay", "cancel"]),
    ("SECURITY",  ["security", "theft", "missing", "unsafe", "guard", "cctv", "camera",
                   "stranger", "harassment", "threat"]),
    ("HOSTEL",    ["hostel", "room", "dormitory", "warden", "mess food", "bed", "mattress"]),
    ("ACADEMIC",  ["marks", "result", "exam", "attendance", "certificate", "hall ticket",
                   "faculty", "professor", "syllabus", "timetable"]),
]

PRIORITY_RULES = [
    ("critical", ["emergency", "fire", "flood", "collapse", "injury", "accident", "gas leak", "evacuation"]),
    ("high",     ["not working", "broken", "no power", "outage", "unsafe", "critical", "urgent", "days"]),
    ("medium",   ["issue", "problem", "slow", "sometimes", "intermittent", "often"]),
    ("low",      ["minor", "small", "suggestion", "request", "improvement"]),
]


def classify_complaint(title: str, description: str) -> dict:
    """
    Classify a complaint into a category with confidence score.
    Also determine priority.
    """
    text = f"{title} {description}".lower()
    text = re.sub(r"[^\w\s]", " ", text)

    # --- Category Detection ---
    category_scores: dict[str, float] = {}
    for code, keywords in CATEGORY_RULES:
        matches = sum(1 for kw in keywords if kw in text)
        if matches > 0:
            category_scores[code] = matches / len(keywords)

    if category_scores:
        best_category = max(category_scores, key=lambda k: category_scores[k])
        confidence = round(min(category_scores[best_category] * 3, 1.0), 2)
    else:
        best_category = "OTHER"
        confidence = 0.5

    # --- Priority Detection ---
    detected_priority = "medium"
    for priority, keywords in PRIORITY_RULES:
        if any(kw in text for kw in keywords):
            detected_priority = priority
            break

    # --- Extract location hints ---
    location_hints = []
    block_match = re.findall(r"block\s+([a-z0-9]+)", text)
    room_match = re.findall(r"room\s+([a-z0-9]+)", text)
    lab_match = re.findall(r"lab\s+([0-9]+)", text)

    if block_match:
        location_hints.append(f"Block {block_match[0].upper()}")
    if room_match:
        location_hints.append(f"Room {room_match[0].upper()}")
    if lab_match:
        location_hints.append(f"Lab {lab_match[0]}")

    return {
        "category": best_category,
        "confidence": confidence,
        "priority": detected_priority,
        "location_hints": location_hints,
        "keywords_matched": [kw for _, kws in CATEGORY_RULES for kw in kws if kw in text],
        "auto_classified": True,
    }


def detect_duplicate_cluster(category_code: str, location_hint: str, recent_count: int) -> dict:
    """
    Check if this complaint is part of a recurring cluster.
    """
    is_cluster = recent_count >= 3
    severity = "critical" if recent_count >= 10 else "high" if recent_count >= 5 else "medium"

    return {
        "is_cluster": is_cluster,
        "cluster_size": recent_count,
        "severity": severity if is_cluster else None,
        "message": (
            f"Recurring Campus Issue Detected: {recent_count} reports of {category_code} "
            f"issues in {location_hint or 'this area'} within the last 7 days."
            if is_cluster else None
        ),
    }
