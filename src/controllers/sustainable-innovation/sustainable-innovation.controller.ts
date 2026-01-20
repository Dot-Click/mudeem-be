import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import uploadFile from '../../utils/upload';
import SuccessHandler from '../../utils/successHandler';
import Project from '../../models/sustainable-innovation/project';
import User from '../../models/user/user.model';
import { sentPushNotification } from '../../utils/firebase';

const createProject: RequestHandler = async (req, res) => {
  // #swagger.tags = ['sustainble-innovation']
  try {
    const { title, description } = req.body;
    const user = req.user;

    let images = await Promise.all(
      req?.files?.map(async (item) => {
        const result = await uploadFile(item?.buffer);
        return result.secure_url;
      }) || []
    );

    const project = await Project.create({
      user: user?._id,
      title,
      description,
      // images: urls || []
      documents: images
    });

    return SuccessHandler({
      res,
      data: project,
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

const getAllProjects: RequestHandler = async (req, res) => {
  // #swagger.tags = ['sustainble-innovation']
  try {
    const { page = 0, limit = 10 } = req.query;
    const skip = Number(page) * Number(limit);

    const project = await Project.aggregate([
      {
        $facet: {
          totalDocs: [
            {
              $match: { status: 'requested' }
            },
            {
              $count: 'count'
            }
          ],
          projects: [
            {
              $match: {
                status: 'requested'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
              }
            },
            {
              $unwind: '$user'
            },
            {
              $skip: skip
            },
            {
              $limit: Number(limit)
            },
            {
              $sort: {
                createdAt: -1
              }
            }
          ]
        }
      }
    ]);

    return SuccessHandler({
      res,
      data: project,
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

const getSingleProject: RequestHandler = async (req, res) => {
  // #swagger.tags = ['sustainble-innovation']
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('user');

    return SuccessHandler({
      res,
      data: project,
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

const changeProjectStatus: RequestHandler = async (req, res) => {
  // #swagger.tags = ['sustainble-innovation']

  try {
    const { id } = req.params;
    const { points = 0, status = 'requested' } = req.body;

    const project = await Project.findById(id).populate('user', 'name email');

    if (!project) {
      return ErrorHandler({
        message: 'Posts not found',
        statusCode: 404,
        req,
        res
      });
    }
    project.status = String(status);
    await project.save();

    const user = await User.findById(project?.user);
    if (!user) {
      return ErrorHandler({
        message: 'User not found',
        statusCode: 404,
        req,
        res
      });
    }
    await User.updateOne(
      { _id: req.user?._id },
      {
        $inc: { greenPoints: points },
        $push: {
          greenPointsHistory: {
            points: points || 0,
            reason: "Sustainable Innovation",
            type: "credit",
            date: new Date()
          }
        }
      }
    );

    const token = user?.firebaseToken || '';
    await sentPushNotification(
      token,
      `Sustainable Innovation accepted`,
      `Congratulations! You have earned ${points} green points for Sustainable Innovation.`,
      user._id.toString(),
      points.toString()
    );
    return SuccessHandler({
      res,
      data: project,
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

export { createProject, getAllProjects, getSingleProject, changeProjectStatus };
