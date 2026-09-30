"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaintController_1 = require("../controllers/complaintController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, complaintController_1.submitComplaint);
router.get('/', auth_1.authenticate, complaintController_1.getComplaints);
router.get('/analytics/summary', auth_1.authenticate, (0, auth_1.authorize)('admin', 'hod', 'principal'), complaintController_1.getComplaintAnalytics);
router.get('/:id', auth_1.authenticate, complaintController_1.getComplaintById);
router.patch('/:id/status', auth_1.authenticate, (0, auth_1.authorize)('admin', 'hod', 'principal', 'faculty'), complaintController_1.updateComplaintStatus);
exports.default = router;
//# sourceMappingURL=complaints.js.map