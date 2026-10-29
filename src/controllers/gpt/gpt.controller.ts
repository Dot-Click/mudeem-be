import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import mongoose from 'mongoose';
import SuccessHandler from '../../utils/successHandler';
import Chat from '../../models/gpt/chat.model';
import User from '../../models/user/user.model';
import GptUsage from '../../models/gpt/gptUsage.model';
import { Setting } from '../../models/settings';
import { generateAiResponse, createThread } from '../../utils/openai';

const FALLBACK_BOT_MESSAGE =
  "I couldn't generate a response. Please try again.";

const DAILY_LIMIT = 50;

const refundDailyUsage = async (
  userId: unknown,
  dateKey: string
): Promise<void> => {
  try {
    await GptUsage.updateOne(
      { user: userId, date: dateKey, count: { $gt: 0 } },
      { $inc: { count: -1 } }
    );
  } catch {
    // A failed refund must not mask the original provider error.
  }
};

const sendMessage: RequestHandler = async (req, res) => {
  // #swagger.tags = ['gpt']
  try {
    if (!req.user?.subscriptions.sustainbuddyGPT) {
      return ErrorHandler({
        message: 'You need to subscribe to SustainBuddy GPT to access this feature',
        statusCode: 403,
        req,
        res
      });
    }
    const userMessage = String(
      req.body.message ?? req.body.content ?? ''
    ).trim();
    if (!userMessage) {
      return ErrorHandler({
        message: 'message or content is required',
        statusCode: 400,
        req,
        res
      });
    }

    const userId = req.user?._id;
    const todayKey = new Date().toISOString().slice(0, 10);
    const usage = await GptUsage.findOneAndUpdate(
      { user: userId, date: todayKey },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    if (usage.count > DAILY_LIMIT) {
      // The app maps `code` to a translated message. A bare 429 is
      // indistinguishable from the per-minute limiter, which tells the user to
      // retry "in a moment" — wrong advice for a cap that resets tomorrow.
      return ErrorHandler({
        message: 'Daily SustainBuddy GPT message limit reached',
        statusCode: 429,
        code: 'DAILY_LIMIT',
        req,
        res
      });
    }

    const exChat = await Chat.findOne({
      user: req.user?._id
    });
    if (!exChat) {
      const thread = await createThread();
      const messageText = await generateAiResponse(thread, userMessage, [
        'environment',
        'greenry'
      ]);
      if (!messageText) {
        // The provider call never produced a response, so give the user
        // their daily allowance back instead of silently burning it.
        await refundDailyUsage(userId, todayKey);
      }
      const pattern = /【\d+:\d+†source】/g;
      const response =
        (messageText?.replace(pattern, '') ?? '').trim() ||
        FALLBACK_BOT_MESSAGE;
      const initialMessages = [
        { sender: 'user', content: userMessage },
        { sender: 'bot', content: response }
      ];
      await Chat.create({
        user: req.user?._id,
        messages: initialMessages,
        thread
      });

      const setting = await Setting.findOne().sort({ createdAt: -1 });
      const pts = Number(setting?.gptMessageGreenPoints || 0);
      if (pts > 0 && req.user?._id) {
        await User.updateOne(
          { _id: req.user._id },
          {
            $inc: { greenPoints: pts },
            $push: {
              greenPointsHistory: {
                points: pts,
                reason: 'SustainBuddy GPT Chat',
                type: 'credit',
                date: new Date()
              }
            }
          }
        );
      }

      return SuccessHandler({
        res,
        data: { response },
        statusCode: 201
      });
    }

    const messageText = await generateAiResponse(
      exChat.thread,
      userMessage,
      ['environment', 'greenry']
    );
    if (!messageText) {
      // The provider call never produced a response, so give the user
      // their daily allowance back instead of silently burning it.
      await refundDailyUsage(userId, todayKey);
    }
    const pattern = /【\d+:\d+†source】/g;
    const response =
      (messageText?.replace(pattern, '') ?? '').trim() || FALLBACK_BOT_MESSAGE;
    (exChat.messages as unknown as { sender: string; content: string }[]).push(
      { sender: 'user', content: userMessage },
      { sender: 'bot', content: response }
    );
    await exChat.save();

    const setting = await Setting.findOne().sort({ createdAt: -1 });
    const pts = Number(setting?.gptMessageGreenPoints || 0);
    if (pts > 0 && req.user?._id) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $inc: { greenPoints: pts },
          $push: {
            greenPointsHistory: {
              points: pts,
              reason: 'SustainBuddy GPT Chat',
              type: 'credit',
              date: new Date()
            }
          }
        }
      );
    }

    return SuccessHandler({
      res,
      data: { chat: response },
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
const getChat: RequestHandler = async (req, res) => {
  // #swagger.tags = ['gpt']
  try {
    const chat = await Chat.findOne({
      user: req.user?._id
    });
    if (!req.user?.subscriptions.sustainbuddyGPT) {
      return ErrorHandler({
        message: 'You need to subscribe to SustainBuddy GPT to access this feature',
        statusCode: 403,
        req,
        res
      });
    }
    if (!chat) {
      return ErrorHandler({
        message: 'Chat not found',
        statusCode: 404,
        req,
        res
      });
    }
    return SuccessHandler({
      res,
      data: { chat: chat },
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

export { sendMessage, getChat };
