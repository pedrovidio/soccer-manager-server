import { Router, Request, Response, NextFunction } from 'express';
import { SuperAdminController, VenueOwnerController, CourtsController } from '../../controllers/venue/VenueControllers.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();
const superAdminCtrl  = new SuperAdminController();
const venueOwnerCtrl  = new VenueOwnerController();
const courtsCtrl      = new CourtsController();

function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.auth?.role !== role) { res.status(403).json({ error: 'Forbidden' }); return; }
    next();
  };
}

const isSuperAdmin  = [authenticate, requireRole('super_admin')];
const isVenueOwner  = [authenticate, requireRole('venue_owner')];

// ── Super Admin ──────────────────────────────────────────────────────────────
router.post('/admin/setup',                                          (req, res) => superAdminCtrl.setup(req, res));
router.post('/admin/login',                                          (req, res) => superAdminCtrl.login(req, res));
router.patch('/admin/commission',              ...isSuperAdmin,      (req, res) => superAdminCtrl.updateCommission(req, res));
router.patch('/admin/payment-info',            ...isSuperAdmin,      (req, res) => superAdminCtrl.updatePaymentInfo(req, res));
router.get('/admin/venue-owners/pending',      ...isSuperAdmin,      (req, res) => superAdminCtrl.listPendingOwners(req, res));
router.patch('/admin/venue-owners/:venueOwnerId/:action', ...isSuperAdmin, (req, res) => superAdminCtrl.reviewOwner(req, res));

// ── Venue Owner ──────────────────────────────────────────────────────────────
router.post('/venue-owners/register',                                (req, res) => venueOwnerCtrl.register(req, res));
router.post('/venue-owners/login',                                   (req, res) => venueOwnerCtrl.login(req, res));
router.post('/venue-owners/venues',            ...isVenueOwner,      (req, res) => venueOwnerCtrl.createVenue(req, res));
router.post('/venue-owners/courts',            ...isVenueOwner,      (req, res) => venueOwnerCtrl.createCourt(req, res));
router.post('/venue-owners/availabilities',    ...isVenueOwner,      (req, res) => venueOwnerCtrl.addAvailability(req, res));
router.get('/venue-owners/match-history',      ...isVenueOwner,      (req, res) => venueOwnerCtrl.listMatchHistory(req, res));
router.post('/venue-owners/matches/:matchId/charge', ...isVenueOwner, (req, res) => venueOwnerCtrl.chargeRental(req, res));

// ── Public (group admins searching courts) ───────────────────────────────────
router.get('/courts/available',                                      (req, res) => courtsCtrl.listAvailable(req, res));

export { router as venueRouter };
