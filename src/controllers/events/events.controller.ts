import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import Event from '../../models/user/events.model';
import moment from 'moment';

const createEvent: RequestHandler = async (req, res) => {
  // #swagger.tags = ['events']
  try {
    const { name, description, dateTime, location } = req.body;
    const event = await Event.create({
      name,
      description,
      dateTime,
      location
    });
    return SuccessHandler({
      res,
      data: event,
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
const getAllEvents: RequestHandler = async (req, res) => {
  // #swagger.tags = ['events']
  try {
    const { page = 0, limit = 10 } = req.query;
    const skip = Number(page) * Number(limit);
    interface IFilter {
      name?: { $regex: string; $options: string };
      dateTime?: { $gte: Date; $lt: Date };
    }
    const filter: IFilter = {};

    req.query.search &&
      (filter['name'] = {$regex: String(req.query.search), $options: 'i'});

    req.query.dateTime &&
      (filter['dateTime'] = {
        $gte: moment(String(req.query.dateTime)).toDate(),
        $lt: moment(String(req.query.dateTime)).add(1, 'day').toDate()
      });

    const events = await Event.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    return SuccessHandler({ res, data: events, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

const getEvent: RequestHandler = async (req, res) => {
  // #swagger.tags = ['events']
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return ErrorHandler({
        message: 'Event not found',
        statusCode: 404,
        req,
        res
      });
    }
    return SuccessHandler({ res, data: event, statusCode: 200 });
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};
const updateEvent: RequestHandler = async (req, res) => {
  // #swagger.tags = ['events']
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!event) {
      return ErrorHandler({
        message: 'Event not found',
        statusCode: 404,
        req,
        res
      });
    }
    return SuccessHandler({
      res,
      data: event,
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
const deleteEvent: RequestHandler = async (req, res) => {
  // #swagger.tags = ['events']
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return ErrorHandler({
        message: 'Event not found',
        statusCode: 404,
        req,
        res
      });
    }
    return SuccessHandler({
      res,
      data: 'Event deleted successfully',
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

export { createEvent, getAllEvents, getEvent, updateEvent, deleteEvent };
