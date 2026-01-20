import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import Company from '../../models/waste/company.model';
import Waste from '../../models/waste/request.model';
import User from '../../models/user/user.model';
import { sentPushNotification } from '../../utils/firebase';

const createCompany: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    const { name, description, location, contact, email, website } = req.body;
    const company = await Company.create({
      name,
      location,
      contact,
      email,
      website,
      description
    });
    return SuccessHandler({
      res,
      data: company,
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
const getAllCompanies: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    const companies = await Company.find({
      isActive: true
    });
    return SuccessHandler({ res, data: companies, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const deleteCompany: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    const { id } = req.params;
    const company = await Company.findByIdAndUpdate(id, { isActive: false });
    return SuccessHandler({ res, data: company, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const createRequest: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    const {
      wasteType,
      quantity,
      description,
      address1,
      address2,
      pickupDateTime,
      user,
      company
    } = req.body;
    const request = await Waste.create({
      wasteType,
      quantity,
      description,
      address1,
      address2,
      pickupDateTime,
      user,
      company
    });
    return SuccessHandler({
      res,
      data: request,
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

const getAllRequests: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    interface IFilters {
      status?: string;
      company?: string;
      pickupDateTime?: { $gte: Date; $lte: Date };
      user?: string;
    }

    // #swagger.parameters['query'] = {status: 'requested', company: 'company_id', pickupDateTime: '["2021-09-01T00:00:00.000Z", "2021-09-30T00:00:00.000Z"]', page: 0, limit: 10}
    let filters: IFilters = {};
    const user = req.user;
    user?.role === 'admin' ? null : (filters.user = user?._id);
    req.query.status ? (filters.status = req.query.status as string) : null;
    req.query.company ? (filters.company = req.query.company as string) : null;
    req.query.pickupDateTime
      ? JSON.parse(req.query.pickupDateTime as string).length > 1 &&
      (filters.pickupDateTime = {
        $gte: new Date(JSON.parse(req.query.pickupDateTime as string)[0]),
        $lte: new Date(JSON.parse(req.query.pickupDateTime as string)[1])
      })
      : null;
    let page = Number(req.query.page) || 0;
    let limit = Number(req.query.limit) || 10;
    const skip = page * limit;

    const requests = await Waste.find(filters)
      .skip(skip)
      .limit(limit)
      .populate('company')
      .populate('user')
      .sort({ createdAt: -1 });

    return SuccessHandler({ res, data: requests, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const getRequestById: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    const { id } = req.params;
    const request = await Waste.findById(id)
      .populate('company')
      .populate('user');
    if (!request) {
      return ErrorHandler({
        message: 'Request not found',
        statusCode: 404,
        req,
        res
      });
    }
    return SuccessHandler({ res, data: request, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const approveRejectRequest: RequestHandler = async (req, res) => {
  // #swagger.tags = ['waste']
  try {
    const { id } = req.params;
    const { status } = req.body;
    const request = await Waste.findByIdAndUpdate(id, { status });
    const user = await User.findById(request?.user);
    if (request && status === 'accepted') {
      await User.updateOne(
        { _id: req.user?._id },
        {
          $inc: { greenPoints: req.body.greenPoints },
          $push: {
            greenPointsHistory: {
              points: req.body.greenPoints || 0,
              reason: "Waste",
              type: "credit",
              date: new Date()
            }
          }
        }
      );
      const token = user?.firebaseToken || '';
      await sentPushNotification(
        token,
        `Waste accepted`,
        `Congratulations! You have earned ${req.body.greenPoints} green points for Waste.`,
        user?._id.toString(),
        req.body.greenPoints.toString()
      );
    }
    return SuccessHandler({ res, data: request, statusCode: 200 });
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
  createCompany,
  getAllCompanies,
  deleteCompany,
  createRequest,
  getAllRequests,
  approveRejectRequest,
  getRequestById
};
