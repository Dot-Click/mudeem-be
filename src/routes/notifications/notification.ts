import express from 'express';
import { Router } from 'express';
import * as notificationController from '../../controllers/notification/notification.controller';
import { isAuthenticated } from '../../middleware/auth.middleware';
const router: Router = express.Router();

router.route('/all').get(notificationController.fetchNotificationForAdmin);
router
  .route('/send')
  .post(isAuthenticated, notificationController.sendNotificationFromAdmin);
router
  .route('/')
  .get(isAuthenticated, notificationController.fetchNotification);
router
  .route('/')
  .put(isAuthenticated, notificationController.updateSeenNotification);

export default router;
