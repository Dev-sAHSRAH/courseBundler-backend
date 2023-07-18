import express from "express";
import {
    addLecture,
    createCourse,
    deleteCourse,
    deleteLecture,
    getAllCourses,
    getCourseLectures,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import {
    isAuthenticated,
    authorizeAdmin,
    authorizeSubscribers,
} from "../middlewares/auth.js";

const router = express.Router();

// Get all courses without lectures
router.route("/courses").get(getAllCourses);

// Create new course - only admin
router
    .route("/createcourse")
    .post(isAuthenticated, authorizeAdmin, singleUpload, createCourse);

// Add lecture, delete course, get course details

router
    .route("/course/:id")
    .get(isAuthenticated, authorizeSubscribers, getCourseLectures)
    .post(isAuthenticated, authorizeAdmin, singleUpload, addLecture)
    .delete(isAuthenticated, authorizeAdmin, deleteCourse);

// delete lecture
router
    .route("/lecture")
    .delete(isAuthenticated, authorizeAdmin, singleUpload, deleteLecture);

export default router;
