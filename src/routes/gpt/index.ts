import express from 'express';
import { Router } from 'express';
import { isAuthenticated } from '../../middleware/auth.middleware';
import { createUserRateLimitMiddleware } from '../../middleware/rateLimit.middleware';
import * as gptController from '../../controllers/gpt/gpt.controller';

const router: Router = express.Router();

const gptRateLimit = createUserRateLimitMiddleware(
  20,
  60 * 1000,
  'SustainBuddy GPT is busy right now. Please try again in a moment.'
);

router
  .route('/')
  .get(isAuthenticated, gptController.getChat)
  .post(isAuthenticated, gptRateLimit, gptController.sendMessage);

export default router;
