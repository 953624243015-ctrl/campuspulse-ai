"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const adminOnly = (0, auth_1.authorize)('admin', 'principal');
const adminHod = (0, auth_1.authorize)('admin', 'hod', 'principal');
router.get('/dashboard', auth_1.authenticate, adminOnly, adminController_1.getAdminDashboard);
router.get('/departments', auth_1.authenticate, adminHod, adminController_1.getDepartments);
// Users
router.get('/users', auth_1.authenticate, adminOnly, adminController_1.getUsers);
router.post('/users', auth_1.authenticate, adminOnly, adminController_1.createUser);
router.patch('/users/:id', auth_1.authenticate, adminOnly, adminController_1.updateUser);
router.delete('/users/:id', auth_1.authenticate, adminOnly, adminController_1.deleteUser);
// Equipment & Maintenance
router.get('/equipment', auth_1.authenticate, adminHod, adminController_1.getEquipment);
router.post('/equipment/:id/maintenance', auth_1.authenticate, adminOnly, adminController_1.addMaintenanceRecord);
// Announcements
router.get('/announcements', auth_1.authenticate, adminHod, adminController_1.getAnnouncements);
router.post('/announcements', auth_1.authenticate, (0, auth_1.authorize)('admin', 'faculty', 'hod', 'principal'), adminController_1.createAnnouncement);
// Emergency
router.post('/emergency-alert', auth_1.authenticate, adminOnly, adminController_1.createEmergencyAlert);
// Sustainability
router.get('/sustainability', auth_1.authenticate, adminHod, adminController_1.getSustainabilityData);
exports.default = router;
//# sourceMappingURL=admin.js.map