import express, { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { isAdmin, isAuthenticated } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import * as schema from '../validations/auth.schema';
import multerMiddleware from '../middleware/multer.middleware';
import { createUserRateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router: Router = express.Router();

// /forgotPassword answers whether an email is registered, so cap it per IP to
// keep that from being used to enumerate accounts in bulk.
const forgotPasswordRateLimit = createUserRateLimitMiddleware(
  5,
  15 * 60 * 1000,
  'Too many password reset attempts. Please try again in 15 minutes.'
);

// GET routes
router.route('/logout').get(auth.logout);
router
  .route('/me')
  .get(isAuthenticated, auth.me)
  .put(isAuthenticated, auth.updateProfile)
  .delete(isAuthenticated, auth.deleteProfile);

// POST routes
router.route('/register-user').post(validate(schema.register), auth.register);
router.route('/login').post(validate(schema.login), auth.login);
router.route('/find-users').get(isAuthenticated, auth.findUsers);
router
  .route('/requestEmailToken')
  .post(validate(schema.requestEmailToken), auth.requestEmailToken);
router
  .route('/verifyEmail')
  .post(validate(schema.verifyEmailToken), auth.verifyEmail);
router
  .route('/forgotPassword')
  .post(
    forgotPasswordRateLimit,
    validate(schema.requestEmailToken),
    auth.forgotPassword
  );

// PUT routes
router
  .route('/resetPassword')
  .put(validate(schema.resetPassword), auth.resetPassword);
router
  .route('/updatePassword')
  .put(isAuthenticated, validate(schema.updatePassword), auth.updatePassword);

router.route('/delete-account').delete(isAuthenticated, auth.deleteProfile);
router.route('/deleteProfile').delete(isAuthenticated, auth.deleteProfile);
router.route('/deleteProfile/:id').delete(isAuthenticated, auth.deleteProfile);

router
  .route('/updateProfile')
  .put(
    isAuthenticated,
    multerMiddleware.single('profilePicture'),
    auth.updateProfile
  );

router.route('/push-notfications').put(isAuthenticated, auth.pushNotification);

router.route('/green-points').put(isAuthenticated, auth.greenPoints);

// DELETE routes
router
  .route('/removeSessions')
  .delete(
    isAuthenticated,
    validate(schema.removeSessions),
    auth.removeSessions
  );

// Toggle Notifications  routes
router
  .route('/toggle-notifications')
  .get(isAuthenticated, auth.toggleNotifications);

export default router;
