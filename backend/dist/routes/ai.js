"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.get('/risk-alerts', auth_1.authenticate, (0, auth_1.authorize)('faculty', 'mentor', 'hod', 'admin', 'principal'), analyticsController_1.getRiskAlerts);
router.post('/study-plan/generate', auth_1.authenticate, (0, auth_1.authorize)('student'), rateLimiter_1.aiRateLimiter, analyticsController_1.generateStudyPlan);
router.get('/skill-gap/:studentId', auth_1.authenticate, analyticsController_1.getSkillGapAnalysis);
router.post('/assistant', auth_1.authenticate, rateLimiter_1.aiRateLimiter, analyticsController_1.campusAssistant);
router.get('/insights', auth_1.authenticate, (0, auth_1.authorize)('hod', 'admin', 'principal', 'faculty'), analyticsController_1.getAIInsights);
router.post('/meeting/summarize', auth_1.authenticate, (0, auth_1.authorize)('faculty', 'hod', 'admin', 'principal'), rateLimiter_1.aiRateLimiter, analyticsController_1.generateMeetingSummary);
exports.default = router;
//# sourceMappingURL=ai.js.map