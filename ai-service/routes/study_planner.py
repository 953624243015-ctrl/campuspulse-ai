from flask import Blueprint, request, jsonify
from services.study_planner_service import generate_study_plan

study_planner_bp = Blueprint("study_planner", __name__)


@study_planner_bp.post("/generate")
def generate():
    data = request.get_json()

    student_id  = data.get("studentId", "")
    subjects    = data.get("subjects", [])
    marks_data  = data.get("marksData", [])
    exam_date   = data.get("examDate")
    daily_hours = float(data.get("dailyStudyHours", 4))
    weak_topics = data.get("weakTopics", [])
    semester    = int(data.get("semester", 1))

    if not subjects:
        return jsonify({"error": "subjects list is required", "success": False}), 400

    try:
        plan = generate_study_plan(
            student_id=student_id,
            subjects=subjects,
            marks_data=marks_data,
            exam_date=exam_date,
            daily_study_hours=daily_hours,
            weak_topics=weak_topics,
            semester=semester,
        )
        return jsonify({"success": True, "data": plan})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
