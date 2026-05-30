import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import Pool from '../../models/carpooling/pool';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import User from '../../models/user/user.model';
import { Setting } from '../../models/settings';
import { sentPushNotification } from '../../utils/firebase';
import { IUser } from '../../types/models/user';
// done.
const createPool: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const { pickupLocation, whereTo, time, availableSeats } = req.body;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRideCount = await Pool.countDocuments({
      user: req.user?.id,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (recentRideCount >= 2) {
      return ErrorHandler({
        message:
          "You've reached your daily ride limit. Please try again after 24 hours.",
        statusCode: 429,
        req,
        res
      });
    }

    const pool = await Pool.create({
      pickupLocation,
      whereTo,
      time,
      availableSeats,
      user: req.user?.id,
      existingUsers: []
    });
    return SuccessHandler({
      res,
      data: { pool },
      statusCode: 201
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return ErrorHandler({
        message: "Can't create more than one active pool.",
        statusCode: 409,
        req,
        res
      });
    }

    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

// done.
const getPools: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const userId = req.user?.id;
    console.log(userId);

    const allPools = await Pool.find({
      rideEnded: false,
      user: { $ne: new mongoose.Types.ObjectId(userId) },
      rideStarted: false
    })
      .populate('user', false)
      .exec();

    return SuccessHandler({
      res,
      data: allPools,
      statusCode: 201
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

const myPool: RequestHandler = async (req, res) => {
  // done.
  try {
    const userId = req.user?._id;
    console.log('Selceted pool', req.query.rideEnded);
    if (req.query.rideEnded !== undefined) {
      let filters: { user?: ObjectId; rideEnded?: boolean } = {};

      filters.rideEnded = req.query.rideEnded === 'true';
      filters.user = userId;
      // filters.rideStarted = false;

      const selectedPools = await Pool.find(filters)
        .populate('existingUsers', false)
        .exec();

      if (!selectedPools) {
        return ErrorHandler({
          message: 'Pool not found.',
          statusCode: 404,
          req,
          res
        });
      }

      return SuccessHandler({
        res,
        data: selectedPools,
        statusCode: 200
      });
    }

    const allPools = await Pool.find({ user: userId })
      .populate('existingUsers', false)
      .exec();

    return SuccessHandler({
      res,
      data: allPools,
      statusCode: 201
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

const getPoolById: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const id = req.params.id;

    const selectedPool = await Pool.findById(id)
      .populate('existingUsers', false)
      .exec();

    if (!selectedPool) {
      return ErrorHandler({
        message: 'Pool not found.',
        statusCode: 500,
        req,
        res
      });
    }

    return SuccessHandler({
      res,
      data: selectedPool,
      statusCode: 201
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
const deletePool: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const id = req.params.id;
    if (!id) {
      return ErrorHandler({
        message: "Id can't be empty.",
        statusCode: 400,
        req,
        res
      });
    }

    const alue = await Pool.findByIdAndDelete(id);

    if (!alue) {
      return SuccessHandler({
        res,
        data: 'Pool already deleted successfully',
        statusCode: 201
      });
    }

    return SuccessHandler({
      res,
      data: 'Pool deleted successfully',
      statusCode: 201
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

const updatePool: RequestHandler = async (req, res) => {
  try {
    // #swagger.tags = ['carpooling']
    const {
      pickupLocation,
      whereTo,
      time,
      availableSeats,
      userIdToAdd,
      userIdToDropOff,
      rideStarted
    } = req.body;
    const poolId = req.params.id;
    var foundPool = await Pool.findById(poolId);
    if (!foundPool) {
      return ErrorHandler({
        message: 'Pool not found.',
        statusCode: 404,
        req,
        res
      });
    }
    const newUpdatedPool = foundPool;
    // drop
    if (userIdToDropOff) {
      const doesDroppingOffUserExist = foundPool.droppedOffUsers.find(
        (element) => element.toString() === userIdToDropOff.toString()
      );
      if (doesDroppingOffUserExist) {
        return ErrorHandler({
          message: 'User already dropped off.',
          statusCode: 400,
          req,
          res
        });
      } else {
        const userIndexInExisting = foundPool.existingUsers.findIndex(
          (element) => element.toString() === userIdToDropOff.toString()
        );
        if (userIndexInExisting === -1) {
          return ErrorHandler({
            message: 'User is not in the ride.',
            statusCode: 400,
            req,
            res
          });
        }
        newUpdatedPool.existingUsers.splice(userIndexInExisting, 1);
        newUpdatedPool.droppedOffUsers.push(userIdToDropOff);
        // Increase  seats when a user is dropped off
        newUpdatedPool.availableSeats += 1;
      }
    }
    // add
    if (userIdToAdd) {
      const doesDroppingOffUserExist = foundPool.existingUsers.find(
        (element) => element.toString() === userIdToAdd.toString()
      );
      if (doesDroppingOffUserExist) {
        return ErrorHandler({
          message: 'User already in the pool.',
          statusCode: 400,
          req,
          res
        });
      } else {
        var isPoolFull = foundPool.availableSeats === 0;
        if (isPoolFull) {
          return ErrorHandler({
            message: 'Pool is full.',
            statusCode: 400,
            req,
            res
          });
        }

        // Allow the user to join
        newUpdatedPool.existingUsers.push(userIdToAdd);
        newUpdatedPool.availableSeats -= 1; // Decrease seat count
      }
    }
    if (foundPool.rideStarted === false) {
      if (availableSeats) newUpdatedPool.availableSeats = availableSeats;
      if (pickupLocation) newUpdatedPool.pickupLocation = pickupLocation;
      if (whereTo) newUpdatedPool.whereTo = whereTo;
      if (time) newUpdatedPool.time = time;
    }
    if (rideStarted) newUpdatedPool.rideStarted = true;
    await newUpdatedPool.save();
    return SuccessHandler({
      res,
      data: newUpdatedPool,
      statusCode: 201
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

const endRide: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ErrorHandler({
        message: 'Invalid pool id.',
        statusCode: 400,
        req,
        res
      });
    }

    const pool = await Pool.findOneAndUpdate(
      {
        _id: id,
        user: req.user?._id,
        rideEnded: false
      },
      {
        $set: {
          rideEnded: true,
          rideStarted: true
        }
      },
      {
        new: false
      }
    );

    if (!pool) {
      return ErrorHandler({
        message: 'Ride not found, already ended, or not owned by the user.',
        statusCode: 409,
        req,
        res
      });
    }

    await Pool.updateOne(
      { _id: pool._id },
      {
        $addToSet: {
          droppedOffUsers: { $each: pool.existingUsers }
        },
        $set: {
          existingUsers: []
        }
      }
    );

    const setting = await Setting.findOne().sort({ createdAt: -1 });
    if (!setting) {
      throw new Error('Settings not found');
    }

    var greenPointsHistoryForResponse = {
      points: 0,
      type: 'credit',
      reason: 'carpooling'
    };

    const carPoolingGreenPoints = Number(setting.carPoolingGreenPoints || 0);
    greenPointsHistoryForResponse.points = carPoolingGreenPoints;

    const user = req.user as IUser;
    const userToken = user?.firebaseToken || '';

    await User.findOneAndUpdate(
      { _id: req.user?._id },
      {
        $inc: { greenPoints: carPoolingGreenPoints },
        $push: {
          greenPointsHistory: {
            points: carPoolingGreenPoints || 0,
            reason: "Lift",
            type: "credit",
            date: new Date()
          }
        }
      }
    );

    await sentPushNotification(
      userToken,
      `Lift accepted`,
      `Congratulations! You have earned ${carPoolingGreenPoints} green points for Lift.`,
      user?._id.toString(),
      carPoolingGreenPoints.toString()
    );

    return SuccessHandler({
      res,
      data: greenPointsHistoryForResponse,
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

const startRide: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ErrorHandler({
        message: 'Invalid pool id.',
        statusCode: 400,
        req,
        res
      });
    }

    const pool = await Pool.findOneAndUpdate(
      {
        _id: id,
        user: req.user?._id,
        rideEnded: false,
        rideStarted: false
      },
      {
        $set: {
          rideStarted: true
        }
      },
      { new: true }
    );

    if (!pool) {
      return ErrorHandler({
        message: 'Ride not found, already started, already ended, or not owned by the user.',
        statusCode: 409,
        req,
        res
      });
    }

    return SuccessHandler({
      res,
      data: pool,
      statusCode: 201
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

const getAllPools: RequestHandler = async (req, res) => {
  // #swagger.tags = ['carpooling']
  try {
    const allPools = await Pool.find().populate('user', false).exec();

    return SuccessHandler({
      res,
      data: allPools,
      statusCode: 201
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
  createPool,
  getPools,
  getPoolById,
  deletePool,
  updatePool,
  endRide,
  myPool,
  startRide,
  getAllPools
};
