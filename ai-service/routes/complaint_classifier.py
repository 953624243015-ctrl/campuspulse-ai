from flask import Blueprint, request, jsonify
from services.complaint_classifier_service import classify_complaint, detect_duplicate_cluster

complaint_bp = Blueprint("complaint", __name__)


@complaint_bp.post("/classify")
def classify():
    data = request.get_json()
    title = data.get("title", "")
    description = data.get("description", "")

    if not title and not description:
        return jsonify({"error": "title or description required", "success": False}), 400

    try:
        result = classify_complaint(title, description)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@complaint_bp.post("/cluster-check")
def cluster_check():
    data = request.get_json()
    category_code = data.get("categoryCode", "")
    location_hint = data.get("locationHint", "")
    recent_count  = int(data.get("recentCount", 0))

    try:
        result = detect_duplicate_cluster(category_code, location_hint, recent_count)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
