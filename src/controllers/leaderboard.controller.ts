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
    let data;

    if (type === 'today') {
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
      data = await User.aggregate([
        {
          $match: {
            role: { $ne: 'admin' },
            isActive: { $ne: false }
          }
        },
        { $unwind: '$greenPointsHistory' },
        {
          $match: {
            'greenPointsHistory.date': { $gte: startOfDay, $lt: endOfDay }
          }
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
        { $sort: { points: -1 } }
      ]);
    } else if (type === 'week') {
      const startOfWeek = new Date(new Date().setDate(new Date().getDate() - 7));
      startOfWeek.setHours(0, 0, 0, 0);
      data = await User.aggregate([
        {
          $match: {
            role: { $ne: 'admin' },
            isActive: { $ne: false }
          }
        },
        { $unwind: '$greenPointsHistory' },
        {
          $match: {
            'greenPointsHistory.date': { $gte: startOfWeek }
          }
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
        { $sort: { points: -1 } }
      ]);
    } else {
      data = await User.aggregate([
        {
          $match: {
            role: { $ne: 'admin' },
            isActive: { $ne: false }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            profilePicture: 1,
            points: { $ifNull: ['$greenPoints', 0] }
          }
        },
        { $sort: { points: -1, name: 1 } }
      ]);
    }

    return SuccessHandler({
      res,
      data: data || [],
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
        $match: {
          role: { $ne: 'admin' },
          isActive: { $ne: false }
        }
      },
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
    ]); // get all non-admin users and their greenPoints
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
