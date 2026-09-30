"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hodController_1 = require("../controllers/hodController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const hodUp = (0, auth_1.authorize)('hod', 'admin', 'principal');
router.get('/dashboard', auth_1.authenticate, hodUp, hodController_1.getHODDashboard);
router.get('/students/analytics', auth_1.authenticate, hodUp, hodController_1.getDepartmentStudentAnalytics);
router.get('/faculty/workload', auth_1.authenticate, hodUp, hodController_1.getFacultyWorkload);
router.get('/skill-gap', auth_1.authenticate, hodUp, hodController_1.getDepartmentSkillGap);
exports.default = router;
//# sourceMappingURL=hod.js.map