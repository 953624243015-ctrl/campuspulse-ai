"""
AI Study Planner Service
Generates personalized, prioritized study plans based on:
- Enrolled subjects
- Weak areas (from marks data)
- Exam dates
- Daily study hours
- Assignment deadlines
"""

from datetime import date, timedelta, datetime
from typing import List, Dict, Any
import math


def generate_study_plan(
    student_id: str,
    subjects: List[Dict],
    marks_data: List[Dict],
    exam_date: str | None,
    daily_study_hours: float,
    weak_topics: List[str],
    semester: int,
) -> Dict[str, Any]:
    """
    Generate a structured study plan.

    Priority weighting:
      - Subjects with lower marks → higher priority
      - Subjects with more credits → more time allocated
      - Weak topics explicitly flagged → dedicated sessions
    """

    today = date.today()
    end_date = datetime.strptime(exam_date, "%Y-%m-%d").date() if exam_date else today + timedelta(days=30)

    if end_date <= today:
        end_date = today + timedelta(days=14)

    total_days = (end_date - today).days
    available_days = max(1, total_days)

    # Build subject priority map from marks
    marks_map: Dict[str, float] = {}
    for m in marks_data:
        code = m.get("code", "")
        avg = float(m.get("avg_pct", 50) or 50)
        marks_map[code] = avg

    # Assign priority (1=highest, 5=lowest) based on marks
    subject_plans = []
    total_credits = sum(int(s.get("credits", 3)) for s in subjects)

    for sub in subjects:
        code = sub.get("code") or sub.get("subject_code", "")
        name = sub.get("name") or sub.get("subject_name", code)
        credits = int(sub.get("credits", 3))
        avg_pct = marks_map.get(code, 60.0)

        # Priority: lower marks → higher priority
        if avg_pct < 40:
            priority = 1
        elif avg_pct < 55:
            priority = 2
        elif avg_pct < 70:
            priority = 3
        elif avg_pct < 85:
            priority = 4
        else:
            priority = 5

        # Time allocation: proportional to credits, boosted for weak subjects
        weight = credits / total_credits if total_credits > 0 else 1 / len(subjects)
        boost = 1.5 if priority <= 2 else 1.2 if priority == 3 else 1.0
        daily_minutes = math.floor(daily_study_hours * 60 * weight * boost)

        subject_plans.append({
            "subject_id": sub.get("id", ""),
            "name": name,
            "code": code,
            "priority": priority,
            "avg_pct": avg_pct,
            "daily_minutes": max(30, min(daily_minutes, 120)),
        })

    # Sort by priority
    subject_plans.sort(key=lambda x: x["priority"])

    # Generate daily tasks
    tasks = []
    current_date = today
    day_counter = 0

    while current_date < end_date:
        weekday = current_date.weekday()  # 0=Mon, 6=Sun
        if weekday == 6:  # Skip Sundays
            current_date += timedelta(days=1)
            continue

        # Rotate subjects across days
        sub_for_day = subject_plans[day_counter % len(subject_plans)] if subject_plans else None

        if sub_for_day:
            tasks.append({
                "subject_id": sub_for_day["subject_id"],
                "title": f"Study: {sub_for_day['name']}",
                "description": (
                    f"Focus on {'weak topics: ' + ', '.join(weak_topics[:2]) if weak_topics and sub_for_day['priority'] <= 2 else 'key concepts and practice problems'}. "
                    f"Current score: {sub_for_day['avg_pct']}%."
                ),
                "scheduled_date": current_date.isoformat(),
                "duration_minutes": sub_for_day["daily_minutes"],
                "priority": sub_for_day["priority"],
                "is_completed": False,
            })

        # Add revision session every 5 days
        if day_counter > 0 and day_counter % 5 == 0:
            tasks.append({
                "subject_id": subject_plans[0]["subject_id"] if subject_plans else "",
                "title": "Revision Session",
                "description": "Review previous week's topics. Solve past papers and practice questions.",
                "scheduled_date": current_date.isoformat(),
                "duration_minutes": 60,
                "priority": 2,
                "is_completed": False,
            })

        current_date += timedelta(days=1)
        day_counter += 1

    # Exam prep sessions in last 3 days
    final_prep_start = end_date - timedelta(days=3)
    for i in range(3):
        prep_date = final_prep_start + timedelta(days=i)
        if prep_date.weekday() != 6 and prep_date >= today:
            tasks.append({
                "subject_id": "",
                "title": f"Exam Prep Day {i + 1} – Full Revision",
                "description": "Go through all subjects. Focus on formulae, definitions, and common exam questions.",
                "scheduled_date": prep_date.isoformat(),
                "duration_minutes": int(daily_study_hours * 60),
                "priority": 1,
                "is_completed": False,
            })

    # Sort tasks by date
    tasks.sort(key=lambda t: t["scheduled_date"])

    return {
        "title": f"AI Study Plan – Semester {semester}",
        "student_id": student_id,
        "start_date": today.isoformat(),
        "end_date": end_date.isoformat(),
        "exam_date": exam_date,
        "daily_study_hours": daily_study_hours,
        "total_days": available_days,
        "subjects_covered": len(subject_plans),
        "total_tasks": len(tasks),
        "is_ai_generated": True,
        "subject_breakdown": [
            {
                "name": s["name"],
                "code": s["code"],
                "priority": s["priority"],
                "avg_pct": s["avg_pct"],
                "daily_minutes": s["daily_minutes"],
            }
            for s in subject_plans
        ],
        "tasks": tasks,
        "tips": [
            "Start with your weakest subjects each day when your mind is fresh.",
            "Take a 5-minute break after every 25 minutes of study (Pomodoro technique).",
            "Review your notes within 24 hours of learning for better retention.",
            "Practice past question papers in the final week.",
            "Ensure 7–8 hours of sleep during exam preparation.",
        ],
        "note": "This plan is AI-generated based on your marks and subjects. Adjust timings to fit your schedule.",
    }
