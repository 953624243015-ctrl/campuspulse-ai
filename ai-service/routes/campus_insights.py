from flask import Blueprint, request, jsonify
from services.campus_insight_service import (
    run_all_insights,
    generate_attendance_insights,
    generate_complaint_cluster_insights,
    generate_assignment_insights,
    generate_maintenance_insights,
)

insights_bp = Blueprint("insights", __name__)


@insights_bp.post("/run-all")
def run_all():
    """Trigger all insight generators — called by cron or admin."""
    try:
        results = run_all_insights()
        total = sum(len(v) for v in results.values())
        return jsonify({
            "success": True,
            "data": {
                "total_insights_generated": total,
                "breakdown": {k: len(v) for k, v in results.items()},
                "details": results,
            }
        })
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@insights_bp.post("/attendance")
def attendance():
    try:
        result = generate_attendance_insights()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@insights_bp.post("/complaints")
def complaints():
    try:
        result = generate_complaint_cluster_insights()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@insights_bp.post("/maintenance")
def maintenance():
    try:
        result = generate_maintenance_insights()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
