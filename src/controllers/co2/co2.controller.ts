import { RequestHandler } from 'express';
import OpenAI from 'openai';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import { requestCo2Analysis } from '../../utils/openai';
import Co2Usage from '../../models/co2/co2Usage.model';

const DAILY_LIMIT = 50;

const CLOUDINARY_HOST = 'res.cloudinary.com';

/**
 * Cloud names whose delivery URLs this endpoint will accept.
 *
 * The mobile app uploads to its own Cloudinary account, which is not the one
 * the backend uploads to, so the allowlist has to be explicit. Set
 * CO2_ALLOWED_CLOUD_NAMES to a comma-separated list; it falls back to
 * CLOUDINARY_NAME when unset.
 */
const allowedCloudNames = (): string[] =>
  (process.env.CO2_ALLOWED_CLOUD_NAMES || process.env.CLOUDINARY_NAME || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

const isAllowedImageUrl = (rawUrl: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (parsed.hostname !== CLOUDINARY_HOST) return false;

  const names = allowedCloudNames();
  if (names.length === 0) return false;
  return names.some((name) => parsed.pathname.startsWith(`/${name}/`));
};

const extractJson = (raw: string): Record<string, unknown> | null => {
  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    return null;
  }
};

const refundDailyUsage = async (
  userId: unknown,
  dateKey: string
): Promise<void> => {
  try {
    await Co2Usage.updateOne(
      { user: userId, date: dateKey, count: { $gt: 0 } },
      { $inc: { count: -1 } }
    );
  } catch {
    // A failed refund must not mask the original provider error.
  }
};

const analyze: RequestHandler = async (req, res) => {
  // #swagger.tags = ['co2']
  try {
    const { imageUrl, weightInGrams } = req.body as {
      imageUrl: string;
      weightInGrams: string;
    };
    const language = req.body.language === 'ar' ? 'ar' : 'en';

    if (!isAllowedImageUrl(imageUrl)) {
      return ErrorHandler({
        message: 'imageUrl is not a valid Cloudinary URL',
        statusCode: 400,
        req,
        res
      });
    }

    const weight = Number(weightInGrams);
    if (!Number.isFinite(weight) || weight <= 0) {
      return ErrorHandler({
        message: 'weightInGrams must be a number greater than 0',
        statusCode: 400,
        req,
        res
      });
    }

    const userId = req.user?._id;
    const todayKey = new Date().toISOString().slice(0, 10);
    const usage = await Co2Usage.findOneAndUpdate(
      { user: userId, date: todayKey },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    if (usage.count > DAILY_LIMIT) {
      // The app maps `code` to a translated message. A bare 429 is
      // indistinguishable from the per-minute limiter, which tells the user to
      // retry "in a moment" — wrong advice for a cap that resets tomorrow.
      return ErrorHandler({
        message: 'Daily CO2 scan limit reached',
        statusCode: 429,
        code: 'DAILY_LIMIT',
        req,
        res
      });
    }

    let raw: string | null;
    try {
      raw = await requestCo2Analysis(imageUrl, weight, language);
    } catch (error) {
      // The scan never ran, so give the user their daily allowance back.
      // Without this a provider outage silently burns all 50 attempts.
      await refundDailyUsage(userId, todayKey);

      if (error instanceof OpenAI.APIError) {
        const statusCode =
          error.status === 429 ? 429 : error.status === 401 || error.status === 403 ? error.status : 502;
        return ErrorHandler({
          message: 'CO2 analysis provider request failed',
          statusCode,
          req,
          res
        });
      }
      return ErrorHandler({
        message: 'CO2 analysis provider request failed',
        statusCode: 502,
        req,
        res
      });
    }

    if (!raw) {
      return SuccessHandler({ res, data: { status: 'error' }, statusCode: 200 });
    }

    const parsed = extractJson(raw);
    if (!parsed || parsed.status !== 'success') {
      return SuccessHandler({ res, data: { status: 'error' }, statusCode: 200 });
    }

    const itemName = parsed.item_name;
    const emission = parsed.total_co2_emission_in_grams;
    if (
      typeof itemName !== 'string' ||
      !itemName.trim() ||
      (typeof emission !== 'string' && typeof emission !== 'number')
    ) {
      return SuccessHandler({ res, data: { status: 'error' }, statusCode: 200 });
    }

    return SuccessHandler({
      res,
      data: {
        status: 'success',
        item_name: itemName,
        total_co2_emission_in_grams: String(emission)
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

export { analyze };
