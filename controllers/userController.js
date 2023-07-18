import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js";
import { Stats } from "../models/Stats.js";

export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, password } = req.body;

    const file = req.file;

    if (!name || !email || !password || !file) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    let user = await User.findOne({ email });

    if (user) {
        return next(new ErrorHandler("User already exists", 409));
    }

    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    // Upload file on cloudinary
    user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });
    sendToken(res, user, "Registered successfully", 201);
});

export const login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("User Doesn't Exist", 401));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(new ErrorHandler("Incorrect email or password", 401));
    }

    sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
    res.status(200)
        .cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        .json({
            success: true,
            message: "Logged out successfully",
        });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        success: true,
        user,
    });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
        return next(new ErrorHandler("Incorrect Old password", 401));
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password changed successfully",
    });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile Updated successfully",
    });
});
export const deleteProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    await user.deleteOne();

    res.status(200)
        .cookie("token", null, {
            expires: new Date(Date.now()),
        })
        .json({
            success: true,
            message: "Profile Deleted successfully",
        });
});

export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    // cloundinary TODO
    const file = req.file;
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
    };

    await user.save();
    res.status(200).json({
        success: true,
        message: "Profile Picture Updated successfully",
    });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("No user with this email", 400));
    }

    const resetToken = await user.getResetToken();
    await user.save();
    // send token via email
    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message = `Click on the link to reset your password. ${url}. If you have not requested then please ignore`;
    await sendEmail(user.email, "Course Bundler Reset Password", message);

    res.status(200).json({
        success: true,
        message: `Reset Token has been sent to ${user.email} `,
    });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params;
    console.log(token);
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    console.log(resetPasswordToken);

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: {
            $gt: Date.now(),
        },
    });
    if (!user) return next(new Error("Token is invalid/expired"));

    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    user.save();
    res.status(200).json({
        success: true,
        message: "Password changed successfully",
    });
});

export const addToplayList = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body._id);

    if (!course) return next(new ErrorHandler("Invalid Course ID", 404));

    const itemExist = user.playlist.find((item) => {
        return item.course.toString() === course._id.toString();
    });

    if (itemExist) return next(new ErrorHandler("Item Already Exists", 409));

    user.playlist.push({
        course: course._id,
        poster: course.poster.url,
    });

    await user.save();
    res.status(200).json({
        success: true,
        message: "Added to playlist",
    });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.query.id);

    if (!course) return next(new ErrorHandler("Invalid Course ID", 404));

    const newPlaylist = user.playlist.filter(
        (item) => item.course.toString() !== course._id.toString()
    );

    user.playlist = newPlaylist;

    await user.save();
    res.status(200).json({
        success: true,
        message: "Removed from playlist",
    });
});

// Admin controllers

export const getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find({});

    res.status(200).json({
        success: true,
        users,
    });
});

export const updateUserRole = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    if (user.role === "user") user.role = "admin";
    else user.role = "user";

    await user.save();

    res.status(200).json({
        success: true,
        message: "Role updated",
    });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    // Cancel Subscription

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User Deleted",
    });
});

User.watch().on("change", async () => {
    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

    const subscription = await User.find({
        "subscription.status": "active",
    });

    stats[0].users = await User.countDocuments();
    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
});
