import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import GreenMap from '../../models/green-map/green-map.model';
import User from '../../models/user/user.model';
import Notification from '../../models/notifications/notifications_model';
import mongoose, { Error } from 'mongoose';
import { sentPushNotification } from '../../utils/firebase';

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
    const notification = await Notification.find()
      .populate({
        path: 'user',
        select: 'name email profilePicture'
      })
      .sort({ createdAt: -1 });

    return SuccessHandler({
      data: notification || [],
      statusCode: 200,
      res
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

const sendNotificationFromAdmin: RequestHandler = async (req, res) => {
  try {
    const { title, content, message, target = 'all', userId, points = '0' } = req.body;
    const bodyContent = String(content || message || '').trim();
    const notificationTitle = String(title || '').trim();

    if (!notificationTitle || !bodyContent) {
      return ErrorHandler({
        message: 'Title and message/content are required',
        statusCode: 400,
        req,
        res
      });
    }

    let query: any = {};
    if (target === 'users') {
      query = { role: 'user' };
    } else if (target === 'vendors') {
      query = { role: 'vendor' };
    } else if (target === 'admins') {
      query = { role: 'admin' };
    } else if (target === 'specific' && userId) {
      query = { _id: userId };
    } else {
      query = {}; // all users
    }

    const targetUsers = await User.find(query).select('_id name email firebaseToken');
    if (!targetUsers || targetUsers.length === 0) {
      return ErrorHandler({
        message: `No recipients found for target group: "${target}". Please check user roles.`,
        statusCode: 400,
        req,
        res
      });
    }

    const numericPoints = Number(points || 0);

    // Create in-app notifications
    const notificationsToInsert = targetUsers.map((u) => ({
      user: u._id,
      title: notificationTitle,
      content: bodyContent,
      points: points,
      seen: false
    }));

    await Notification.insertMany(notificationsToInsert);

    // If points attached, credit to users' greenPoints and greenPointsHistory
    if (numericPoints > 0) {
      const userIds = targetUsers.map((u) => u._id);
      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $inc: { greenPoints: numericPoints },
          $push: {
            greenPointsHistory: {
              points: numericPoints,
              reason: `Notification Reward: ${notificationTitle}`,
              type: 'credit',
              date: new Date()
            }
          }
        }
      );
    }

    // Send push notifications via FCM to users with active tokens
    let pushCount = 0;
    for (const u of targetUsers) {
      if (u.firebaseToken && u.firebaseToken !== 'NULL' && u.firebaseToken !== '') {
        try {
          await sentPushNotification(
            u.firebaseToken,
            notificationTitle,
            bodyContent,
            u._id.toString(),
            points
          );
          pushCount++;
        } catch (err) {
          console.error(`FCM send error for user ${u._id}:`, err);
        }
      }
    }

    return SuccessHandler({
      data: {
        totalRecipients: targetUsers.length,
        pushDelivered: pushCount,
        message: `Notification broadcasted to ${targetUsers.length} user(s) (${target}) successfully.`
      },
      statusCode: 200,
      res
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

export {
  fetchNotification,
  updateSeenNotification,
  fetchNotificationForAdmin,
  sendNotificationFromAdmin
};
