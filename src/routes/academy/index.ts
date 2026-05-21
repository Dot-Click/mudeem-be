import express from 'express';
import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../../middleware/auth.middleware';
import * as academyController from '../../controllers/academy/book.controller';
import multerMiddleware from '../../middleware/multer.middleware';
import { createSensitiveRateLimitMiddleware } from '../../middleware/rateLimit.middleware';
// import * as schema from '../../validations/academy.schema';
// import { validate } from '../../middleware/validate.middleware';

const router: Router = express.Router();
const sensitiveWriteLimit = createSensitiveRateLimitMiddleware(5);

router
  .route('/book')
  .post(
    isAuthenticated,
    isAdmin,
    multerMiddleware.fields([
      { name: 'cover', maxCount: 1 },
      { name: 'book', maxCount: 1 }
    ]),
    // validate(schema.createAcademy),
    academyController.createBook
  )
  .get(academyController.getAllBooks);

router
  .route('/book/:id')
  .get(isAuthenticated, academyController.getBook)
  .patch(
    isAuthenticated,
    // validate(schema.updateAcademy),
    multerMiddleware.fields([
      { name: 'cover', maxCount: 1 },
      { name: 'file', maxCount: 1 }
    ]),
    academyController.updateBook
  )
  .delete(isAuthenticated, academyController.deleteBook);

router
  .route('/book/mine/purchased')
  .get(isAuthenticated, academyController.getMyBooks);

router
  .route('/book/purchase/:id')
  .put(isAuthenticated, sensitiveWriteLimit, academyController.purchaseBook);

router
  .route('/book/findIfAlreadyPurchased/:id')
  .get(isAuthenticated, academyController.findIfAlreadyPurchased);

router.route('/book/download/:id');
//   .get(isAuthenticated, academyController.downloadBook);

export default router;
