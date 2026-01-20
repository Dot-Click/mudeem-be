import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import uploadFile from '../../utils/upload';
import Farm from '../../models/farm/farm.model';
import User from '../../models/user/user.model';
import { sentPushNotification } from '../../utils/firebase';

const createFarm: RequestHandler = async (req, res) => {
  // #swagger.tags = ['farm']
  try {
    const {
      location,
      renewableEnergy,
      fertilizer,
      desalinationMethod,
      farmDesignSpecs,
      desiredEquipment,
      budgetDetails,
      electricGeneration
    } = req.body;

    console.log('fdffd');
    if (!req?.files?.length) {
      return ErrorHandler({
        message: 'Please upload images',
        statusCode: 400,
        req,
        res
      });
    }

    let images = await Promise.all(
      req?.files?.map(async (item) => {
        const result = await uploadFile(item?.buffer);
        return result.secure_url;
      }) || []
    );

    const farm = await Farm.create({
      user: req.user?._id,
      location,
      renewableEnergy,
      fertilizer,
      desalinationMethod,
      farmDesignSpecs,
      desiredEquipment,
      budgetDetails,
      electricGeneration,
      images
    });

    return SuccessHandler({
      res,
      data: { farm, message: 'Farm created successfully' },
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

const getFarms: RequestHandler = async (req, res) => {
  // #swagger.tags = ['farm']
  try {
    const { page = 0, limit = 10 } = req.query;
    const skip = Number(page) * Number(limit);
    interface IFilter {
      location?: { $regex: string; $options: string };
      renewableEnergy?: string;
      fertilizer?: string;
      desalinationMethod?: string;
      status?: string;
      user?: string;
    }
    const filter: IFilter = {};

    req.query.location &&
      (filter['location'] = {
        $regex: String(req.query.location),
        $options: 'i'
      });

    req.query.renewableEnergy &&
      (filter['renewableEnergy'] = String(req.query.renewableEnergy));

    req.query.fertilizer &&
      (filter['fertilizer'] = String(req.query.fertilizer));

    req.query.desalinationMethod &&
      (filter['desalinationMethod'] = String(req.query.desalinationMethod));

    req.query.status && (filter['status'] = String(req.query.status));

    req.user?.role === 'user' && (filter['user'] = req.user?._id);

    const farms = await Farm.find(filter)
      .populate('user')
      .skip(skip)
      .limit(Number(limit))
      .sort({
        createdAt: -1
      });
    return SuccessHandler({ res, data: farms, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const getFarm: RequestHandler = async (req, res) => {
  // #swagger.tags = ['farm']
  try {
    const farm = await Farm.findById(req.params.id).populate('user');
    if (!farm) {
      return ErrorHandler({
        message: 'Farm not found',
        statusCode: 404,
        req,
        res
      });
    }
    return SuccessHandler({ res, data: farm, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const approveRejectFarm: RequestHandler = async (req, res) => {
  // #swagger.tags = ['farm']
  try {
    const { id } = req.params;
    const { status } = req.body;

    const farm = await Farm.findById(id);
    if (!farm) {
      return ErrorHandler({
        message: 'Farm not found',
        statusCode: 404,
        req,
        res
      });
    }

    if (status === 'approved') {
      const user = await User.findById(farm.user);

      farm.status = 'approved';
      await User.findByIdAndUpdate(farm.user, {
        $inc: { greenPoints: req.body.greenPoints },
        $push: {
          greenPointsHistory: {
            points: req.body.greenPoints,
            type: 'credit',
            reason: 'Farm approved',
            createdAt: new Date()
          }
        }
      });
      const token = user?.firebaseToken || '';
      await sentPushNotification(
        token,
        `Farm Approved`,
        `Congratulations! You have earned ${req.body.greenPoints} green points for your Farm approval.`,
        user?._id.toString(),
        req.body.greenPoints.toString()
      );
    } else if (status === 'rejected') {
      farm.status = 'rejected';
    }
    await farm.save();
    return SuccessHandler({
      res,
      data: farm,
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

export { createFarm, getFarms, getFarm, approveRejectFarm };
