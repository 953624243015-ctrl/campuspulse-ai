"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, notificationController_1.getNotifications);
router.patch('/:id/read', auth_1.authenticate, notificationController_1.markAsRead);
router.patch('/read-all', auth_1.authenticate, notificationController_1.markAllAsRead);
router.get('/announcements', auth_1.authenticate, notificationController_1.getAnnouncements);
router.get('/emergency-alerts', auth_1.authenticate, notificationController_1.getEmergencyAlerts);
exports.default = router;
//# sourceMappingURL=notifications.js.map