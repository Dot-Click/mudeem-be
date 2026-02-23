import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import mongoose from 'mongoose';
import SuccessHandler from '../../utils/successHandler';
import Chat from '../../models/gpt/chat.model';
import { generateAiResponse, createThread } from '../../utils/openai';

const FALLBACK_BOT_MESSAGE =
  "I couldn't generate a response. Please try again.";

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

    const exChat = await Chat.findOne({
      user: req.user?._id
    });
    if (!exChat) {
      const thread = await createThread();
      const messageText = await generateAiResponse(thread, userMessage, [
        'environment',
        'greenry'
      ]);
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
    const pattern = /【\d+:\d+†source】/g;
    const response =
      (messageText?.replace(pattern, '') ?? '').trim() || FALLBACK_BOT_MESSAGE;
    (exChat.messages as unknown as { sender: string; content: string }[]).push(
      { sender: 'user', content: userMessage },
      { sender: 'bot', content: response }
    );
    await exChat.save();
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
