from flask import Blueprint, request, jsonify
from services.student_risk_service import compute_risk_factors, run_risk_analysis_for_department

risk_bp = Blueprint("risk", __name__)


@risk_bp.post("/analyse/student")
def analyse_student():
    data = request.get_json()
    student_id = data.get("studentId")
    semester = data.get("semester", 5)

    if not student_id:
        return jsonify({"error": "studentId required", "success": False}), 400

    try:
        result = compute_risk_factors(student_id, semester)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@risk_bp.post("/analyse/department")
def analyse_department():
    data = request.get_json()
    dept_id = data.get("departmentId")

    if not dept_id:
        return jsonify({"error": "departmentId required", "success": False}), 400

    try:
        results = run_risk_analysis_for_department(dept_id)
        return jsonify({
            "success": True,
            "data": {
                "analysed": len(results),
                "results": results,
            }
        })
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
