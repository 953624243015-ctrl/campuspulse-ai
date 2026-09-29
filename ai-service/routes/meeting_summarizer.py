from flask import Blueprint, request, jsonify
from services.meeting_summarizer_service import summarize_meeting

meeting_bp = Blueprint("meeting", __name__)


@meeting_bp.post("/summarize")
def summarize():
    data = request.get_json()
    text = data.get("text") or data.get("rawNotes") or data.get("transcript", "")
    meeting_id = data.get("meetingId", "")

    if not text:
        return jsonify({"error": "text, rawNotes, or transcript required", "success": False}), 400

    try:
        result = summarize_meeting(text, meeting_id)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
