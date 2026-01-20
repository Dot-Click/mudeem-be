import SuccessHandler from '../../utils/successHandler';
import ErrorHandler from '../../utils/errorHandler';
import { RequestHandler } from 'express';
import User from '../../models/user/user.model';
import { IUser } from '../../types/models/user';
import SendMail from '../../utils/sendMail';

const getAllVendors: RequestHandler = async (req, res) => {
  // #swagger.tags = ['vendor']
  try {
    const searchFilter: object = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search as string, $options: 'i' } },
            { email: { $regex: req.query.search as string, $options: 'i' } },
            { phone: { $regex: req.query.search as string, $options: 'i' } },
            { username: { $regex: req.query.search as string, $options: 'i' } }
          ]
        }
      : {};
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const vendors = await User.find({
      role: 'vendor',
      isActive: true,
      ...searchFilter
    })
      .skip(skip)
      .limit(limit);

    // later add no of products, no of total, no of completed, no of pending orders

    return SuccessHandler({
      res,
      data: vendors,
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
const approveVendor: RequestHandler = async (req, res) => {
  // #swagger.tags = ['vendor']
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const vendor: IUser | null = await User.findById(id);
    if (!vendor) {
      return ErrorHandler({
        message: 'Vendor not found',
        statusCode: 404,
        req,
        res
      });
    }
    vendor.adminApproved = approved;
    await vendor.save();

    SuccessHandler({
      res,
      data: { message: 'Vendor approved successfully', vendor },
      statusCode: 200
    });

    await SendMail({
      email: vendor.email,
      subject: 'Vendor Approval',
      text: `Your account has been ${
        approved ? 'approved' : 'disapproved'
      } by the admin`
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
const deleteVendor: RequestHandler = async (req, res) => {
  // #swagger.tags = ['vendor']
  try {
    const { id } = req.params;
    const vendor: IUser | null = await User.findById(id);
    if (!vendor) {
      return ErrorHandler({
        message: 'Vendor not found',
        statusCode: 404,
        req,
        res
      });
    }
    vendor.isActive = false;
    await vendor.save();

    SuccessHandler({
      res,
      data: { message: 'Vendor deleted successfully', vendor },
      statusCode: 200
    });

    await SendMail({
      email: vendor.email,
      subject: 'Account Deletion',
      text: `Your account has been deleted by the admin`
    });

    // deactivate all products of this vendor
  } catch (error) {
    return ErrorHandler({
      message: (error as Error).message,
      statusCode: 500,
      req,
      res
    });
  }
};

export { getAllVendors, approveVendor, deleteVendor };
