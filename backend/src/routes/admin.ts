import { Router } from 'express';
import {
  getAdminDashboard, getUsers, createUser, updateUser, deleteUser,
  getEquipment, addMaintenanceRecord, getDepartments,
  getAnnouncements, createAnnouncement, createEmergencyAlert, getSustainabilityData,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const adminOnly = authorize('admin', 'principal');
const adminHod = authorize('admin', 'hod', 'principal');

router.get('/dashboard', authenticate, adminOnly, getAdminDashboard);
router.get('/departments', authenticate, adminHod, getDepartments);

// Users
router.get('/users', authenticate, adminOnly, getUsers);
router.post('/users', authenticate, adminOnly, createUser);
router.patch('/users/:id', authenticate, adminOnly, updateUser);
router.delete('/users/:id', authenticate, adminOnly, deleteUser);

// Equipment & Maintenance
router.get('/equipment', authenticate, adminHod, getEquipment);
router.post('/equipment/:id/maintenance', authenticate, adminOnly, addMaintenanceRecord);

// Announcements
router.get('/announcements', authenticate, adminHod, getAnnouncements);
router.post('/announcements', authenticate, authorize('admin', 'faculty', 'hod', 'principal'), createAnnouncement);

// Emergency
router.post('/emergency-alert', authenticate, adminOnly, createEmergencyAlert);

// Sustainability
router.get('/sustainability', authenticate, adminHod, getSustainabilityData);

export default router;
