import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import uploadFile from '../../utils/upload';
import Reel from '../../models/content-creator/reel';
import ReelComment from '../../models/content-creator/reel-comment';
import mongoose from 'mongoose';
import User from '../../models/user/user.model';
import SuccessHandler from '../../utils/successHandler';
import { sentPushNotification } from '../../utils/firebase';
import ContentCreator from '../../models/content-creator/reel';

const createContent: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']
  try {
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);

    if (!req.user?.subscriptions.contentCreator) {
      return ErrorHandler({
        message: 'You need to subscribe to Content Creator to access this feature',
        statusCode: 403,
        req,
        res
      });
    }
    const { title, description } = req.body;
    const user = await User.findById(req.user?._id);
    const userToken = user?.firebaseToken || '';
    if (!req?.files) {
      return ErrorHandler({
        message: 'Files are required',
        statusCode: 400,
        req,
        res
      });
    }
    // @ts-ignore
    if (!req.files?.thumbnail[0]) {
      return ErrorHandler({
        message: 'Thumbnail is required',
        statusCode: 400,
        req,
        res
      });
    }
    // @ts-ignore
    if (!req.files?.video[0]) {
      return ErrorHandler({
        message: 'Video is required',
        statusCode: 400,
        req,
        res
      });
    }
    // @ts-ignore
    let videoLink = await uploadFile(req.files.video[0].buffer);
    // @ts-ignore
    let thumbnailLink = await uploadFile(req.files.thumbnail[0].buffer);
    const content = await ContentCreator.create({
      user: req.user?._id,
      title,
      description,
      url: videoLink.secure_url,
      thumbnail: thumbnailLink.secure_url
    });
    const contentCreatorGreenPoints = 30;
    await User.updateOne(
      { _id: req.user?._id },
      {
        $inc: { greenPoints: contentCreatorGreenPoints },
        $push: {
          greenPointsHistory: {
            points: contentCreatorGreenPoints || 0,
            reason: "Content Creator",
            type: "credit",
            date: new Date()
          }
        }
      }
    );

    await sentPushNotification(
      userToken,
      `Content Creator accepted`,
      `Congratulations! You have earned ${contentCreatorGreenPoints} green points for Content Creator.`,
      user?._id.toString(),
      contentCreatorGreenPoints.toString()
    );
    return SuccessHandler({
      res,
      data: { message: `Content created`, content },
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

const getReels: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    if (!req.user?.subscriptions.contentCreator) {
      return ErrorHandler({
        message: 'You need to subscribe to Content Creator to access this feature',
        statusCode: 403,
        req,
        res
      });
    }
    const reels = await Reel.find({
      user: req.user?._id
    }).populate({
      path: 'comments',
      populate: {
        path: 'user'
      }
    });
    return SuccessHandler({
      res,
      data: { reels },
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

const getReel: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const excludedIds = req.query.excludedIds
      ? (req.query.excludedIds as string)?.split(',')
      : [];

    // get random reel except the excluded ones
    const reel = await Reel.aggregate([
      {
        $match: {
          _id: {
            $nin: excludedIds.map((id) => new mongoose.Types.ObjectId(id))
          }
        }
      },
      { $sample: { size: 1 } },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'user',
      //       foreignField: '_id',
      //       as: 'userDetails'
      //     }
      //   },
      {
        $lookup: {
          from: 'reelcomments',
          localField: 'comments',
          foreignField: '_id',
          as: 'comments'
        }
      },
      // Unwind comments to process each comment separately
      {
        $unwind: {
          path: '$comments',
          preserveNullAndEmptyArrays: true
        }
      },

      // Lookup user details inside each comment
      {
        $lookup: {
          from: 'users', // Assuming your user collection is named 'users'
          localField: 'comments.user', // The user field inside each comment
          foreignField: '_id',
          as: 'comments.userDetails'
        }
      },

      // Flatten the userDetails array (since lookup returns an array)
      {
        $unwind: {
          path: '$comments.userDetails',
          preserveNullAndEmptyArrays: true // In case some comments don't have a user
        }
      },

      // Group comments back into an array
      {
        $group: {
          _id: '$_id',
          url: { $first: '$url' },
          description: { $first: '$description' },
          comments: { $push: '$comments' },
          likes: { $first: '$likes' },
          user: { $first: '$user' }
        }
      }
    ]);

    if (!reel.length) {
      return ErrorHandler({
        message: 'No reel found',
        statusCode: 404,
        req,
        res
      });
    }
    console.log(reel[0]);
    const user = await User.findById(reel[0].user);

    reel[0].user = user;

    return SuccessHandler({
      res,
      data: { reel },
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

const deleteReel: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);
    if (!reel) {
      return ErrorHandler({
        message: 'Reel not found',
        statusCode: 404,
        req,
        res
      });
    }
    await reel.remove();
    return SuccessHandler({
      res,
      data: { message: `Reel deleted` },
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

const likeUnlikeReel: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);
    let points = 0;
    if (!reel) {
      return ErrorHandler({
        message: 'Reel not found',
        statusCode: 404,
        req,
        res
      });
    }

    const userId = req.user?._id;
    const hasLiked = reel.likes.includes(userId);

    if (hasLiked) {
      reel.likes = reel.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
      points = -50;
    } else {
      reel.likes.push(userId);
      points = 50;
    }
    await reel.save();

    await User.updateOne(
      { _id: userId },
      {
        $inc: { greenPoints: points },
        $push: {
          greenPointsHistory: {
            points: points || 0,
            reason: "Content moderation",
            type: "debit",
            date: new Date()
          }
        }
      }
    );
    return SuccessHandler({
      res,
      data: {
        message: `Reel ${reel.likes.includes(userId) ? 'liked' : 'unliked'}`,
        greenPoints: 50
      },
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

const createComment: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;
    const reel = await Reel.findById(id);
    if (!reel) {
      return ErrorHandler({
        message: 'Reel not found',
        statusCode: 404,
        req,
        res
      });
    }
    // Logic to create a comment
    const comment = await ReelComment.create({
      user: user?._id,
      content
    });
    reel.comments.push(comment._id);
    await reel.save();
    return SuccessHandler({
      res,
      data: comment,
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

const deleteComment: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const { id, commentId } = req.params;
    const reel = await Reel.findById(id);
    if (!reel) {
      return ErrorHandler({
        message: 'Reel not found',
        statusCode: 404,
        req,
        res
      });
    }
    const comment = await ReelComment.findById(commentId);
    if (!comment) {
      return ErrorHandler({
        message: 'Comment not found',
        statusCode: 404,
        req,
        res
      });
    }
    await comment.remove();
    reel.comments = reel.comments.filter(
      (comment) => comment.toString() !== commentId
    );
    await reel.save();
    return SuccessHandler({
      res,
      data: { message: `Comment deleted` },
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

const likeUnlikeComment: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const { id, commentId } = req.params;
    const reel = await Reel.findById(id);
    if (!reel) {
      return ErrorHandler({
        message: 'Reel not found',
        statusCode: 404,
        req,
        res
      });
    }
    const comment = await ReelComment.findById(commentId);
    if (!comment) {
      return ErrorHandler({
        message: 'Comment not found',
        statusCode: 404,
        req,
        res
      });
    }
    const userId = req.user?._id;
    if (comment.likes.includes(userId)) {
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== userId
      );
    } else {
      comment.likes.push(userId);
    }
    await comment.save();
    return SuccessHandler({
      res,
      data: {
        message: `Comment ${comment.likes.includes(userId) ? 'liked' : 'unliked'
          }`
      },
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

const createReply: RequestHandler = async (req, res) => {
  // #swagger.tags = ['content-creator']

  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    const user = req.user;
    const reel = await Reel.findById(id);
    if (!reel) {
      return ErrorHandler({
        message: 'Reel not found',
        statusCode: 404,
        req,
        res
      });
    }
    const comment = await ReelComment.findById(commentId);
    if (!comment) {
      return ErrorHandler({
        message: 'Comment not found',
        statusCode: 404,
        req,
        res
      });
    }
    // Logic to create a reply
    const reply = await ReelComment.create({
      user: user?._id,
      content
    });
    comment.replies.push(reply._id);
    await comment.save();
    return SuccessHandler({
      res,
      data: reply,
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
  createContent,
  getReels,
  getReel,
  deleteReel,
  likeUnlikeReel,
  createComment,
  deleteComment,
  likeUnlikeComment,
  createReply
};
