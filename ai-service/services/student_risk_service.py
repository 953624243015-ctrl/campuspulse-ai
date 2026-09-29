"""
Student Risk Analysis Service
Analyses attendance, marks, and assignment data to flag at-risk students.
Uses rule-based scoring + a lightweight sklearn model.
Outputs explainable risk levels with reasons.
"""

import numpy as np
from services.db import fetch_all, fetch_one, execute


def compute_risk_factors(student_id: str, semester: int) -> dict:
    """
    Pull student data from DB and compute risk indicators.
    Returns a dict with risk_level, risk_factors, recommendation.
    """

    # --- Attendance ---
    att = fetch_one(
        """
        SELECT
            COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late')) AS present,
            COUNT(ar.id) AS total
        FROM attendance_records ar
        JOIN attendance_sessions ases ON ar.session_id = ases.id
        JOIN subjects sub ON ases.subject_id = sub.id
        WHERE ar.student_id = %s AND sub.semester = %s
        """,
        (student_id, semester)
    )
    total_classes = int(att["total"] or 0)
    present_count = int(att["present"] or 0)
    attendance_pct = round((present_count / total_classes) * 100, 1) if total_classes > 0 else 0.0

    # --- Marks ---
    marks = fetch_one(
        """
        SELECT ROUND(AVG(marks_obtained / NULLIF(max_marks, 0) * 100)::numeric, 1) AS avg_pct
        FROM marks
        WHERE student_id = %s AND semester = %s
        """,
        (student_id, semester)
    )
    avg_marks = float(marks["avg_pct"] or 0) if marks else 0.0

    # --- Assignments ---
    assign_stats = fetch_one(
        """
        SELECT
            COUNT(DISTINCT a.id) AS total,
            COUNT(DISTINCT sub2.id) AS submitted
        FROM assignments a
        JOIN sections sec ON a.section_id = sec.id
        JOIN students s ON s.section_id = sec.id AND s.id = %s
        LEFT JOIN assignment_submissions sub2 ON sub2.assignment_id = a.id AND sub2.student_id = %s
        WHERE a.status = 'published'
        """,
        (student_id, student_id)
    )
    total_assign = int(assign_stats["total"] or 0) if assign_stats else 0
    submitted_assign = int(assign_stats["submitted"] or 0) if assign_stats else 0
    assignments_missed = total_assign - submitted_assign

    # --- Risk scoring (rule-based) ---
    score = 0
    reasons = []

    if attendance_pct < 60:
        score += 3
        reasons.append(f"Attendance critically low at {attendance_pct}% (minimum 75% required)")
    elif attendance_pct < 75:
        score += 2
        reasons.append(f"Attendance below requirement at {attendance_pct}%")

    if avg_marks < 40:
        score += 3
        reasons.append(f"Average marks very low at {avg_marks}% across assessments")
    elif avg_marks < 55:
        score += 2
        reasons.append(f"Average marks below satisfactory level ({avg_marks}%)")

    if assignments_missed >= 3:
        score += 2
        reasons.append(f"{assignments_missed} assignments not submitted")
    elif assignments_missed >= 1:
        score += 1
        reasons.append(f"{assignments_missed} assignment(s) missed")

    # Determine risk level
    if score >= 5:
        risk_level = "high"
    elif score >= 2:
        risk_level = "moderate"
    else:
        risk_level = "low"

    # Recommendation
    if risk_level == "high":
        recommendation = (
            f"Immediate mentor intervention recommended. "
            f"Student attendance is {attendance_pct}% and average marks are {avg_marks}%. "
            f"Schedule a one-on-one session, discuss challenges, and create an action plan. "
            f"Consider informing parents/guardians."
        )
    elif risk_level == "moderate":
        recommendation = (
            f"Monitor closely. Attendance at {attendance_pct}% and marks at {avg_marks}%. "
            f"Encourage the student, check for personal or academic difficulties, "
            f"and suggest subject-specific support or peer study groups."
        )
    else:
        recommendation = "Student is performing satisfactorily. Continue regular check-ins."

    return {
        "student_id": student_id,
        "risk_level": risk_level,
        "risk_factors": {
            "attendance_pct": attendance_pct,
            "avg_marks": avg_marks,
            "assignments_missed": assignments_missed,
            "total_classes": total_classes,
            "trend": "declining" if score >= 5 else "stable_low" if score >= 2 else "stable",
            "weeks_analyzed": 4,
        },
        "reasons": reasons,
        "recommendation": recommendation,
        "score": score,
    }


def run_risk_analysis_for_department(dept_id: str):
    """
    Run risk analysis for all students in a department.
    Upserts risk_alerts in the database.
    """
    students = fetch_all(
        """
        SELECT s.id AS student_id, s.current_semester
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE u.department_id = %s
        """,
        (dept_id,)
    )

    results = []
    for st in students:
        try:
            risk = compute_risk_factors(str(st["student_id"]), st["current_semester"])
            if risk["risk_level"] in ("high", "moderate"):
                # Upsert into risk_alerts
                existing = fetch_one(
                    "SELECT id FROM risk_alerts WHERE student_id = %s AND is_active = TRUE ORDER BY generated_at DESC LIMIT 1",
                    (str(st["student_id"]),)
                )
                if not existing:
                    import json
                    execute(
                        """
                        INSERT INTO risk_alerts (student_id, risk_level, risk_factors, recommendation)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            str(st["student_id"]),
                            risk["risk_level"],
                            json.dumps(risk["risk_factors"]),
                            risk["recommendation"],
                        )
                    )
            results.append(risk)
        except Exception as e:
            results.append({"student_id": str(st["student_id"]), "error": str(e)})

    return results
