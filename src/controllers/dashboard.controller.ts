import { RequestHandler } from 'express';
import User from '../models/user/user.model';
import ErrorHandler from '../utils/errorHandler';
import SuccessHandler from '../utils/successHandler';
import Book from '../models/academy/book';
import Product from '../models/shop/product.model';
import Pool from '../models/carpooling/pool';
import Reel from '../models/content-creator/reel';
import Event from '../models/user/events.model';
import Post from '../models/collab-forum/post';
import Farm from '../models/farm/farm.model';

const getAnalytics: RequestHandler = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const bookCount = await Book.countDocuments();
    const productCount = await Product.countDocuments();
    const poolCount = await Pool.countDocuments();
    const reelCount = await Reel.countDocuments();
    const postCount = await Post.countDocuments();
    const eventCount = await Event.countDocuments();
    const farmCount = await Farm.countDocuments();

    return SuccessHandler({
      res,
      data: {
        userCount,
        bookCount,
        productCount,
        poolCount,
        reelCount,
        eventCount,
        farmCount,
        postCount
      },
      statusCode: 200
    });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

export { getAnalytics };
