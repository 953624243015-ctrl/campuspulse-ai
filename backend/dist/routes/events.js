"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, eventController_1.getEvents);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty', 'hod', 'principal'), eventController_1.createEvent);
router.get('/:id', auth_1.authenticate, eventController_1.getEventById);
router.post('/:id/register', auth_1.authenticate, eventController_1.registerForEvent);
router.post('/:id/attendance/qr', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty', 'hod'), eventController_1.markQRAttendance);
router.post('/:id/feedback', auth_1.authenticate, eventController_1.submitEventFeedback);
exports.default = router;
//# sourceMappingURL=events.js.map