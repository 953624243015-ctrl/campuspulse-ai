import { Router } from 'express';
import {
  getRiskAlerts, generateStudyPlan, getSkillGapAnalysis,
  campusAssistant, getAIInsights, generateMeetingSummary,
} from '../controllers/analyticsController';
import { authenticate, authorize } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/risk-alerts', authenticate, authorize('faculty', 'mentor', 'hod', 'admin', 'principal'), getRiskAlerts);
router.post('/study-plan/generate', authenticate, authorize('student'), aiRateLimiter, generateStudyPlan);
router.get('/skill-gap/:studentId', authenticate, getSkillGapAnalysis);
router.post('/assistant', authenticate, aiRateLimiter, campusAssistant);
router.get('/insights', authenticate, authorize('hod', 'admin', 'principal', 'faculty'), getAIInsights);
router.post('/meeting/summarize', authenticate, authorize('faculty', 'hod', 'admin', 'principal'), aiRateLimiter, generateMeetingSummary);

export default router;
