"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const principalController_1 = require("../controllers/principalController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const principals = (0, auth_1.authorize)('principal', 'admin');
router.get('/dashboard', auth_1.authenticate, principals, principalController_1.getPrincipalDashboard);
router.get('/analytics/campus', auth_1.authenticate, principals, principalController_1.getCampusAnalytics);
router.post('/what-if', auth_1.authenticate, principals, principalController_1.runWhatIfSimulation);
router.patch('/insights/:id/acknowledge', auth_1.authenticate, principals, principalController_1.acknowledgeInsight);
exports.default = router;
//# sourceMappingURL=principal.js.map