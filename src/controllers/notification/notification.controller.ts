import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import GreenMap from '../../models/green-map/green-map.model';
import User from '../../models/user/user.model';
import Notification from '../../models/notifications/notifications_model';
import mongoose, { Error } from 'mongoose';

const fetchNotification: RequestHandler = async (req, res) => {
  try {
    console.log('fetchNotification');
    const userId = req.user?._id;
    const notifications = await Notification.find({
      user: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 }); // Sort by createdAt in descending order (newest first)

    if (!notifications || notifications.length === 0) {
      return ErrorHandler({
        message: 'Notification not found',
        statusCode: 400,
        req,
        res
      });
    } else {
      return SuccessHandler({
        data: notifications,
        statusCode: 200,
        res
      });
    }
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const updateSeenNotification: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?._id;
    const notification = await Notification.updateMany(
      { user: new mongoose.Types.ObjectId(userId) },
      { $set: { seen: true } }
    );
    if (!notification) {
      return ErrorHandler({
        message: 'Notification not found',
        statusCode: 400,
        req,
        res
      });
    } else {
      return SuccessHandler({
        data: notification,
        statusCode: 200,
        res
      });
    }
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const fetchNotificationForAdmin: RequestHandler = async (req, res) => {
  try {
    const notification = await Notification.find().populate({
      path: 'user',
      select: 'name email profilePicture'
    });

    if (!notification) {
      return ErrorHandler({
        message: 'Notification not found',
        statusCode: 400,
        req,
        res
      });
    } else {
      return SuccessHandler({
        data: notification,
        statusCode: 200,
        res
      });
    }
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

export { fetchNotification, updateSeenNotification, fetchNotificationForAdmin };
