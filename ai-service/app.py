"""
CampusPulse AI Microservice
Flask application entry point
"""

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from routes.risk import risk_bp
from routes.study_planner import study_planner_bp
from routes.complaint_classifier import complaint_bp
from routes.meeting_summarizer import meeting_bp
from routes.campus_insights import insights_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:5000", "http://localhost:3000"])

# Register blueprints
app.register_blueprint(risk_bp,          url_prefix="/risk")
app.register_blueprint(study_planner_bp, url_prefix="/study-plan")
app.register_blueprint(complaint_bp,     url_prefix="/complaint")
app.register_blueprint(meeting_bp,       url_prefix="/meeting")
app.register_blueprint(insights_bp,      url_prefix="/insights")


@app.get("/health")
def health():
    return {"status": "ok", "service": "campuspulse-ai", "version": "1.0.0"}


@app.errorhandler(404)
def not_found(e):
    return {"error": "Endpoint not found", "success": False}, 404


@app.errorhandler(500)
def server_error(e):
    return {"error": "Internal server error", "success": False}, 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
