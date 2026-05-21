import express from 'express';
import { Router } from 'express';
import * as poolController from '../../controllers/pool/pool.controller';
import { isAdmin, isAuthenticated } from '../../middleware/auth.middleware';
import { createSensitiveRateLimitMiddleware } from '../../middleware/rateLimit.middleware';

const router: Router = express.Router();
const sensitiveWriteLimit = createSensitiveRateLimitMiddleware(5);

router
  .route('/')
  .post(isAuthenticated, sensitiveWriteLimit, poolController.createPool)
  .get(poolController.getPools);

router
  .route('/get-all')
  .get(isAuthenticated, isAdmin, poolController.getAllPools);
router.route('/get-my-pool').get(isAuthenticated, poolController.myPool);
router
  .route('/:id')
  .get(poolController.getPoolById)
  .delete(isAuthenticated, poolController.deletePool)
  .put(isAuthenticated, poolController.updatePool);

router
  .route('/end-ride/:id')
  .put(isAuthenticated, sensitiveWriteLimit, poolController.endRide);
router
  .route('/start-ride/:id')
  .put(isAuthenticated, sensitiveWriteLimit, poolController.startRide);

export default router;
