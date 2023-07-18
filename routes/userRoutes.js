import express from "express";
import {
    addToplayList,
    changePassword,
    deleteProfile,
    deleteUser,
    forgotPassword,
    getAllUsers,
    getMyProfile,
    login,
    logout,
    register,
    removeFromPlaylist,
    resetPassword,
    updateProfile,
    updateProfilePicture,
    updateUserRole,
} from "../controllers/userController.js";
import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

// to register a new user
router.route("/register").post(singleUpload, register);

// Login
router.route("/login").post(login);
// Logout
router.route("/logout").get(logout);

// Get my profile
router
    .route("/me")
    .get(isAuthenticated, getMyProfile)
    .delete(isAuthenticated, deleteProfile);

// change passwOord
router.route("/changepassword").put(isAuthenticated, changePassword);

// Update my profile
router.route("/updateprofile").put(isAuthenticated, updateProfile);
// Update profile picture
router
    .route("/updateprofilepicture")
    .put(isAuthenticated, singleUpload, updateProfilePicture);
// forgot password
router.route("/forgotpassword").post(forgotPassword);
// reset password
router.route("/resetpassword/:token").put(resetPassword);

// add to playlist
router.route("/addtoplaylist").post(isAuthenticated, addToplayList);
// remove from playlist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

// Admin routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);
router
    .route("/admin/user/:id")
    .put(isAuthenticated, authorizeAdmin, updateUserRole)
    .delete(isAuthenticated, authorizeAdmin, deleteUser);

export default router;
