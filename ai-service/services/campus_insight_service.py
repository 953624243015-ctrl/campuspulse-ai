"""
Campus Insight Service
Generates AI insights by analysing campus-wide data patterns.
Runs on a schedule and writes to the ai_insights table.
Each insight includes the underlying data so it is transparent.
"""

import json
from services.db import fetch_all, fetch_one, execute


def generate_attendance_insights():
    """Detect sections with declining attendance over the last 3 weeks."""
    results = []

    sections = fetch_all(
        """
        SELECT s.id, s.name, b.name as batch_name, d.id as dept_id, d.name as dept_name
        FROM sections s
        JOIN batches b ON s.batch_id = b.id
        JOIN courses c ON b.course_id = c.id
        JOIN departments d ON c.department_id = d.id
        WHERE s.id IN (SELECT DISTINCT section_id FROM attendance_sessions)
        """
    )

    for sec in sections:
        # Weekly attendance for last 3 weeks
        weekly = fetch_all(
            """
            SELECT
                DATE_TRUNC('week', ases.session_date) AS week,
                ROUND(
                    (COUNT(ar.id) FILTER (WHERE ar.status IN ('present','late'))::numeric /
                     NULLIF(COUNT(ar.id), 0)) * 100, 1
                ) AS pct
            FROM attendance_sessions ases
            JOIN attendance_records ar ON ar.session_id = ases.id
            JOIN students st ON ar.student_id = st.id
            WHERE st.section_id = %s
            AND ases.session_date > NOW() - INTERVAL '3 weeks'
            GROUP BY week
            ORDER BY week
            """,
            (str(sec["id"]),)
        )

        if len(weekly) >= 2:
            first = float(weekly[0]["pct"] or 0)
            last = float(weekly[-1]["pct"] or 0)
            drop = first - last

            if drop >= 10 and last < 80:
                title = f"Attendance Drop – {sec['dept_name']} Section {sec['name']}"
                desc = (
                    f"Attendance in {sec['dept_name']} Section {sec['name']} "
                    f"has dropped from {first}% to {last}% over the past 3 weeks "
                    f"(a decline of {drop:.1f} percentage points)."
                )
                severity = "critical" if last < 65 else "warning"

                _upsert_insight(
                    insight_type="attendance_trend",
                    target_type="section",
                    target_id=str(sec["id"]),
                    title=title,
                    description=desc,
                    severity=severity,
                    data={"weekly": [dict(w) for w in weekly], "drop": drop},
                )
                results.append(title)

    return results


def generate_complaint_cluster_insights():
    """Flag locations with 3+ complaints in the last 7 days."""
    clusters = fetch_all(
        """
        SELECT
            c.category_id, cc.name AS category_name, cc.code,
            c.location_id, cl.name AS location_name, cl.block,
            COUNT(*) AS complaint_count
        FROM complaints c
        LEFT JOIN complaint_categories cc ON c.category_id = cc.id
        LEFT JOIN campus_locations cl ON c.location_id = cl.id
        WHERE c.created_at > NOW() - INTERVAL '7 days'
        AND c.location_id IS NOT NULL
        GROUP BY c.category_id, cc.name, cc.code, c.location_id, cl.name, cl.block
        HAVING COUNT(*) >= 3
        ORDER BY complaint_count DESC
        """
    )

    results = []
    for cluster in clusters:
        cnt = cluster["complaint_count"]
        location = cluster["location_name"] or "Unknown Location"
        block = f"Block {cluster['block']}" if cluster["block"] else ""
        category = cluster["category_name"] or cluster["code"]

        title = f"Recurring Issue: {category} – {location}"
        desc = (
            f"{cnt} complaints about {category} have been submitted for "
            f"{location} {block} in the last 7 days. "
            f"This pattern indicates a systemic issue requiring immediate admin attention."
        )
        severity = "critical" if cnt >= 8 else "warning" if cnt >= 5 else "warning"

        _upsert_insight(
            insight_type="complaint_cluster",
            target_type="location",
            target_id=str(cluster["location_id"]),
            title=title,
            description=desc,
            severity=severity,
            data={"complaint_count": cnt, "category": category, "location": location},
        )
        results.append(title)

    return results


def generate_assignment_insights():
    """Detect departments with significant assignment completion changes."""
    dept_trends = fetch_all(
        """
        SELECT
            d.id AS dept_id, d.name AS dept_name,
            ROUND(
                COUNT(sub2.id)::numeric / NULLIF(COUNT(a.id), 0) * 100, 1
            ) AS completion_rate,
            COUNT(a.id) AS total_assignments
        FROM departments d
        LEFT JOIN users u ON u.department_id = d.id AND u.role = 'faculty'
        LEFT JOIN faculty f ON f.user_id = u.id
        LEFT JOIN assignments a ON a.faculty_id = f.id
            AND a.created_at > NOW() - INTERVAL '30 days'
        LEFT JOIN assignment_submissions sub2 ON sub2.assignment_id = a.id
        WHERE d.is_active = TRUE
        GROUP BY d.id, d.name
        HAVING COUNT(a.id) > 0
        """
    )

    results = []
    for dept in dept_trends:
        rate = float(dept["completion_rate"] or 0)
        if rate < 60:
            title = f"Low Assignment Completion – {dept['dept_name']}"
            desc = (
                f"Assignment completion rate in {dept['dept_name']} is {rate}% "
                f"(based on {dept['total_assignments']} assignments in the last 30 days). "
                f"This is below the acceptable threshold of 75%."
            )
            _upsert_insight(
                insight_type="assignment_completion",
                target_type="department",
                target_id=str(dept["dept_id"]),
                title=title,
                description=desc,
                severity="warning",
                data={"completion_rate": rate, "total_assignments": dept["total_assignments"]},
            )
            results.append(title)
        elif rate >= 85:
            title = f"High Assignment Completion – {dept['dept_name']}"
            desc = (
                f"Assignment completion rate in {dept['dept_name']} is {rate}%, "
                f"indicating strong student engagement this month."
            )
            _upsert_insight(
                insight_type="assignment_completion",
                target_type="department",
                target_id=str(dept["dept_id"]),
                title=title,
                description=desc,
                severity="info",
                data={"completion_rate": rate},
            )
            results.append(title)

    return results


def generate_maintenance_insights():
    """Flag equipment that is overdue for maintenance."""
    overdue = fetch_all(
        """
        SELECT e.id, e.name, e.asset_tag,
               ec.name AS category_name, cl.name AS location_name,
               e.next_maintenance_date,
               EXTRACT(DAY FROM NOW() - e.next_maintenance_date) AS days_overdue
        FROM equipment e
        LEFT JOIN equipment_categories ec ON e.category_id = ec.id
        LEFT JOIN campus_locations cl ON e.location_id = cl.id
        WHERE e.status NOT IN ('decommissioned')
        AND e.next_maintenance_date < NOW()
        AND e.next_maintenance_date IS NOT NULL
        ORDER BY days_overdue DESC
        LIMIT 10
        """
    )

    results = []
    for eq in overdue:
        days = int(eq["days_overdue"] or 0)
        title = f"Maintenance Overdue – {eq['name']}"
        desc = (
            f"{eq['name']} ({eq['asset_tag'] or 'no tag'}) in {eq['location_name'] or 'Unknown'} "
            f"is {days} days overdue for maintenance. "
            f"Failure risk is elevated. Schedule maintenance promptly."
        )
        severity = "critical" if days > 90 else "warning"

        _upsert_insight(
            insight_type="maintenance_prediction",
            target_type="equipment",
            target_id=str(eq["id"]),
            title=title,
            description=desc,
            severity=severity,
            data={"days_overdue": days, "location": eq["location_name"]},
        )
        results.append(title)

    return results


def run_all_insights():
    """Run all insight generators. Called by a cron job."""
    return {
        "attendance": generate_attendance_insights(),
        "complaints": generate_complaint_cluster_insights(),
        "assignments": generate_assignment_insights(),
        "maintenance": generate_maintenance_insights(),
    }


# ── Private Helpers ──────────────────────────────────────────────────────────

def _upsert_insight(
    insight_type: str,
    target_type: str,
    target_id: str,
    title: str,
    description: str,
    severity: str,
    data: dict,
):
    """Insert a new insight (avoid duplicates within 24 hours for same target)."""
    existing = fetch_one(
        """
        SELECT id FROM ai_insights
        WHERE insight_type = %s AND target_id = %s
        AND generated_at > NOW() - INTERVAL '24 hours'
        """,
        (insight_type, target_id)
    )
    if not existing:
        execute(
            """
            INSERT INTO ai_insights
              (insight_type, target_type, target_id, title, description, severity, data_snapshot)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (insight_type, target_type, target_id, title, description, severity, json.dumps(data))
        )
