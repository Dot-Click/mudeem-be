import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import User from '../../models/user/user.model';

const getAllUsers: RequestHandler = async (req, res) => {
  // #swagger.tags = ['collab-forum']

  try {
    const { page = 0, limit = 8, type } = req.query;
    const skip = Number(page) * Number(limit);

    const user = await User.find();
    return SuccessHandler({
      res,
      data: user,
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

const changeUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const isUserExist = await User.findById(id);
    if (!isUserExist) {
      return ErrorHandler({
        message: 'user not found',
        statusCode: 500,
        req,
        res
      });
    }

    isUserExist.isActive = !isUserExist;
    await isUserExist.save();
    return SuccessHandler({
      res,
      data: isUserExist,
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

export { getAllUsers, changeUserStatus };
