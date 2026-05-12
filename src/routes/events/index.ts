import express from 'express';
import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../../middleware/auth.middleware';
import * as eventsController from '../../controllers/events/events.controller';

const router: Router = express.Router();

router
  .route('/')
  .post(
    isAuthenticated,
    isAdmin,
    // validate(greenMapController.createGreenMap),
    eventsController.createEvent
  )
  .get(eventsController.getAllEvents);

router
  .route('/:id')
  .get(eventsController.getEvent)
  .put(
    isAuthenticated,
    isAdmin,
    // validate(greenMapController.updateGreenMap),
    eventsController.updateEvent
  )
  .delete(isAuthenticated, isAdmin, eventsController.deleteEvent);

export default router;
