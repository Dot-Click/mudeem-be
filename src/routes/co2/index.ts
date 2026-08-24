import express, { Router } from 'express';
import { isAuthenticated } from '../../middleware/auth.middleware';
import { createUserRateLimitMiddleware } from '../../middleware/rateLimit.middleware';
import { validate } from '../../middleware/validate.middleware';
import { analyzeCo2 } from '../../validations/co2.schema';
import * as co2Controller from '../../controllers/co2/co2.controller';

const router: Router = express.Router();

const co2RateLimit = createUserRateLimitMiddleware(
  10,
  60 * 1000,
  'The CO2 scanner is busy right now. Please try again in a moment.'
);

router
  .route('/analyze')
  .post(isAuthenticated, co2RateLimit, validate(analyzeCo2), co2Controller.analyze);

export default router;
