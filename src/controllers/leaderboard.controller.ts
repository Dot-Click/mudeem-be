import User from '../models/user/user.model';
import { IUser, UserSession } from '../types/models/user';
import SuccessHandler from '../utils/successHandler';
import ErrorHandler from '../utils/errorHandler';
import { RequestHandler } from 'express';

const getLeaderboard: RequestHandler = async (req, res) => {
  // #swagger.tags = ['leaderboard']
  try {
    const { type } = req.query;
    // type: all, today, week
    let matchStage: any = {};
    if (type === 'today') {
      matchStage = {
        'greenPointsHistory.date': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      };
    } else if (type === 'week') {
      matchStage = {
        ' .date': {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)).setHours(
            0,
            0,
            0,
            0
          )
        }
      };
    } else {
      matchStage = {};
    }

    const data = await User.aggregate([
      {
        $unwind: '$greenPointsHistory'
      },
      {
        $match: matchStage
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          email: { $first: '$email' },
          phone: { $first: '$phone' },
          profilePicture: { $first: '$profilePicture' },
          points: { $sum: '$greenPointsHistory.points' }
        }
      },
      {
        $sort: { points: -1 }
      }
    ]);
    return SuccessHandler({
      res,
      data,
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

const getLeaderboardById: RequestHandler = async (req, res) => {
  // #swagger.tags = ['leaderboard']

  // we have user id, we need to get the rank of user by greenPoints
  // include the greenPointsHistory of the user
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return ErrorHandler({
        message: 'User not found',
        statusCode: 404,
        req,
        res
      });
    }
    const data = await User.aggregate([
      {
        $unwind: '$greenPointsHistory'
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          profilePicture: { $first: '$profilePicture' },
          points: { $sum: '$greenPointsHistory.points' }
        }
      },
      {
        $sort: { points: -1 }
      }
    ]); // get all users and their greenPoints
    const rank = data.findIndex((item: any) => item._id.toString() === id);
    return SuccessHandler({
      res,
      data: { ...user.toJSON(), rank: rank + 1 },
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

export { getLeaderboard, getLeaderboardById };
