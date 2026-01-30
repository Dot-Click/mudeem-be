import User from '../models/user/user.model';
import { IUser, UserSession } from '../types/models/user';
import SuccessHandler from '../utils/successHandler';
import ErrorHandler from '../utils/errorHandler';
import { RequestHandler } from 'express';
import * as authTypes from '../types/controllers/auth';
import passport from 'passport';
import { captureUserAgent } from '../middleware/userAgent.middleware';
import mongoose from 'mongoose';
import SendMail from '../utils/sendMail';
import uploadFile from '../utils/upload';
import { sentPushNotification } from '../utils/firebase';

/** Case-insensitive email lookup (trimmed). Uses MongoDB collation so casing never matters. */
const findUserByEmail = async (email: string, select?: string): Promise<IUser | null> => {
  const trimmed = (email ?? '').trim();
  if (!trimmed) return null;
  let q = User.findOne({ email: trimmed }).collation({ locale: 'en', strength: 2 });
  if (select) q = q.select(select);
  return q;
};

const pushNotification: RequestHandler = async (req, res) => {
  try {
    const { title, body } = req.body;
    const user = req.user as IUser;
    const token = user.firebaseToken || '';
    sentPushNotification(token, title, body, req.user?._id.toString(), '0');
    return SuccessHandler({
      data: 'Push notification sent successfully',
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

const findUsers: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    if (!req.query.name) {
      return ErrorHandler({
        message: "Name can't be empty.",
        statusCode: 400,
        req,
        res
      });
    }
    const query = req.query.name as string;

    // const filters = {
    //   $or: [
    //     { name: { $regex: new RegExp(query, 'i') } },
    //     { email: { $regex: new RegExp(query, 'i') } },
    //     { username: { $regex: new RegExp(query, 'i') } }
    //   ]
    // };

    // the below one is more restrictive
    const filters = {
      $or: [
        { name: { $regex: `^${query}`, $options: 'i' } },
        { email: { $regex: `^${query}`, $options: 'i' } },
        { username: { $regex: `^${query}`, $options: 'i' } }
      ]
    };

    const users = await User.find(filters);
    return SuccessHandler({
      data: users,
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
//register
const register: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { name, email, phone, username, password, role } =
      req.body as authTypes.RegisterBody;

    if (role === 'admin') {
      return ErrorHandler({
        message: 'Unauthorized',
        statusCode: 401,
        req,
        res
      });
    }
    const user: IUser | null = await User.findOne({
      $or: [{ email }, { username }, { phone }]
    });

    if (user) {
      let conflictField: string = '';
      if (user.email === email) {
        conflictField = 'Email';
      }
      if (user.username === username) {
        conflictField = 'Username';
      }
      if (user.phone === phone) {
        conflictField = 'Phone';
      }
      return ErrorHandler({
        message: `${conflictField} already exists`,
        statusCode: 400,
        req,
        res
      });
    }

    const newUser: IUser | null = await User.create({
      name,
      email,
      phone,
      username,
      password,
      role
    });
    if (!newUser) {
      return ErrorHandler({
        message: 'Failed to create user',
        statusCode: 500,
        req,
        res
      });
    }
    newUser.save();
    SuccessHandler({
      data: newUser,
      statusCode: 201,
      res
    });

    if (role === 'vendor') {
      const admins = await User.find({ role: 'admin' });
      admins.forEach(async (admin: IUser) => {
        await SendMail({
          email: admin.email,
          subject: 'New Vendor Registered',
          text: `A new vendor with the store ${username} has registered.`
        });
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

//request email verification token
const requestEmailToken: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { email } = req.body as authTypes.RequestEmailTokenBody;
    const user: IUser | null = await findUserByEmail(email ?? '');
    if (!user) {
      return ErrorHandler({
        message: 'User does not exist',
        statusCode: 400,
        req,
        res
      });
    }
    const emailVerificationToken: number = Math.floor(
      100000 + Math.random() * 900000
    );
    const emailVerificationTokenExpires: Date = new Date(
      Date.now() + 10 * 60 * 1000
    );
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = emailVerificationTokenExpires;
    await user.save();
    const message: string = `Your email verification token is ${emailVerificationToken} and it expires in 10 minutes`;
    const subject: string = `Email verification token`;
    await SendMail({
      email,
      subject,
      text: message
    });
    return SuccessHandler({
      data: `Email verification token sent to ${email}`,
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

//verify email token
const verifyEmail: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, emailVerificationToken } =
      req.body as authTypes.VerifyEmailTokenBody;
    const user: IUser | null = await findUserByEmail(email ?? '');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User does not exist'
      });
    }
    if (
      user.emailVerificationToken !== emailVerificationToken ||
      !user.emailVerificationTokenExpires || // Check if it exists
      user.emailVerificationTokenExpires.getTime() < Date.now() // Compare timestamps
    ) {
      return ErrorHandler({
        message: 'Invalid token',
        statusCode: 400,
        req,
        res
      });
    }
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();
    return SuccessHandler({
      data: {
        message: 'Email verified successfully'
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

//login
const login: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { email, password, firebaseToken } = req.body as authTypes.LoginBody;
    console.log(email, password);
    //@ts-expect-error passport.authenticate has no return type
    passport.authenticate('local', async (err, user, info) => {
      if (err) {
        return ErrorHandler({
          message: err.message,
          statusCode: 500,
          req,
          res
        });
      }
      if (!user) {
        return ErrorHandler({
          message: info.message,
          statusCode: 400,
          req,
          res
        });
      }
      if (!user.emailVerified) {
        return ErrorHandler({
          message: 'Email not verified',
          statusCode: 400,
          req,
          res
        });
      }
      if (!user.isActive) {
        return ErrorHandler({
          message: 'User has been deactivated',
          statusCode: 400,
          req,
          res
        });
      }
      if (user.role === 'vendor' && !user.adminApproved) {
        return ErrorHandler({
          message: 'Vendor not approved by admin',
          statusCode: 400,
          req,
          res
        });
      }

      if (firebaseToken) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id }, // Find by ID
          { firebaseToken }, // Update the field
          { new: true, runValidators: true } // Return updated user & validate
        );
      }

      req.logIn(user, (err) => {
        if (err) {
          return ErrorHandler({
            message: err.message,
            statusCode: 500,
            req,
            res
          });
        }
        captureUserAgent(req, res, () => {
          return res.status(200).json({
            message: 'Login successful',
            user: user
          });
        });
      });
    })(req, res);
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

//logout
const logout: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    req.logout((err) => {
      if (err) {
        return ErrorHandler({
          message: err.message,
          statusCode: 500,
          req,
          res
        });
      }
      req.session.destroy(() => {
        return SuccessHandler({
          data: 'Logged out successfully',
          statusCode: 200,
          res
        });
      });
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

//forgot password
const forgotPassword: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email } = req.body as authTypes.RequestEmailTokenBody;
    const user: IUser | null = await findUserByEmail(email ?? '');
    if (!user) {
      return ErrorHandler({
        message: 'User does not exist',
        statusCode: 400,
        req,
        res
      });
    }
    const passwordResetToken: number = Math.floor(
      100000 + Math.random() * 900000
    );
    const passwordResetTokenExpires: Date = new Date(
      Date.now() + 10 * 60 * 1000
    );
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;
    await user.save();
    const message: string = `Your password reset token is ${passwordResetToken} and it expires in 10 minutes`;
    const subject: string = `Password reset token`;
    await SendMail({ email, subject, text: message });
    return SuccessHandler({
      data: `Password reset token sent to ${email}`,
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

//reset password
const resetPassword: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, passwordResetToken, password } =
      req.body as authTypes.ResetPasswordBody;
    const user: IUser | null = await findUserByEmail(email ?? '', '+password');
    if (!user) {
      return ErrorHandler({
        message: 'User does not exist',
        statusCode: 400,
        req,
        res
      });
    }
    if (
      user.passwordResetToken !== passwordResetToken ||
      !user.passwordResetTokenExpires || // Check if it exists
      user.passwordResetTokenExpires?.getTime() < Date.now()
    ) {
      return ErrorHandler({
        message: 'Invalid token',
        statusCode: 400,
        req,
        res
      });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();
    return SuccessHandler({
      data: 'Password reset successfully',
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

//update password
const updatePassword: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { currentPassword, newPassword } =
      req.body as authTypes.UpdatePasswordBody;

    const user: IUser | null = await User.findById(req.user?._id).select(
      '+password'
    );
    if (!user) {
      return ErrorHandler({
        message: 'User does not exist',
        statusCode: 400,
        req,
        res
      });
    }
    const isMatch: boolean = await user?.comparePassword(currentPassword);
    if (!isMatch) {
      return ErrorHandler({
        message: 'Invalid credentials',
        statusCode: 400,
        req,
        res
      });
    }
    const samePasswords: boolean = await user?.comparePassword(newPassword);
    if (samePasswords) {
      return ErrorHandler({
        message: 'New password cannot be the same as the current password',
        statusCode: 400,
        req,
        res
      });
    }
    user.password = newPassword;
    await user.save();
    return SuccessHandler({
      data: 'Password updated successfully',
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

//me
const me: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const user = req.user;
    const sessions = (await mongoose.connection.db
      .collection('sessions')
      .find({
        'session.passport.user': user?._id.toString()
      })
      .toArray()) as unknown as UserSession[];
    return SuccessHandler({
      data: {
        user,
        sessions:
          req.user?.role !== 'admin'
            ? {}
            : sessions.map((session) => ({
              _id: session._id,
              deviceInfo: session.session.deviceInfo,
              lastActive: session.session.lastActive,
              current: session._id === req.sessionID
            }))
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

const removeSessions: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { sessionIds } = req.body as authTypes.RemoveSessionsBody;
    const user = req.user;
    await mongoose.connection.db.collection('sessions').deleteMany({
      _id: { $in: sessionIds },
      'session.passport.user': user?._id.toString()
    });
    // if current session is removed, destroy it
    if (sessionIds.includes(req.sessionID)) {
      req.logout((err) => {
        if (err) {
          throw new Error(err.message);
        }
        req.session.destroy((err) => {
          if (err) {
            throw new Error(err.message);
          }
        });
      });
    }
    return SuccessHandler({
      data: 'Sessions removed successfully',
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

const updateProfile: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, username } = req.body;

    let link;
    if (req.file) {
      link = await uploadFile(req.file.buffer);
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
      return ErrorHandler({
        message: 'User not found',
        statusCode: 404,
        req,
        res
      });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (username) user.username = username;
    if (link) user.profilePicture = link.secure_url;
    user.save();
    return SuccessHandler({
      data: { user: user, message: 'User successfully updated' },
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

const greenPoints: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { userId, reason, points, type } =
      req.body as authTypes.GreenPointsBody;
    if (!userId) {
      return ErrorHandler({
        message: 'User ID is required',
        statusCode: 400,
        req,
        res
      });
    }
    await User.updateOne(
      {
        _id: userId
      },
      {
        $inc: {
          greenPoints: points || 0
        },
        $push: {
          greenPointsHistory: {
            points: points || 0,
            reason: reason,
            type: type
          }
        }
      }
    );

    return SuccessHandler({
      data: 'Points successfully updated',
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

const toggleNotifications: RequestHandler = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const user = req.user as IUser;
    const findUser = await User.findById(user._id);
    if (!findUser) {
      return ErrorHandler({
        message: 'User not found',
        statusCode: 404,
        req,
        res
      });
    }
    findUser.allowNotifications = !findUser.allowNotifications;
    const resss = await findUser.save();
    console.log(resss);

    return SuccessHandler({
      data: 'Notification successfully updated',
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

const deleteProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: 'user' });
    if (!user) {
      return ErrorHandler({
        message: 'User not found',
        statusCode: 404,
        req,
        res
      });
    }
    await user.delete();
    return SuccessHandler({
      data: { user: user, message: 'User successfully updated' },
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
  toggleNotifications,
  greenPoints,
  register,
  requestEmailToken,
  verifyEmail,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  removeSessions,
  updateProfile,
  findUsers,
  pushNotification,
  deleteProfile
};
