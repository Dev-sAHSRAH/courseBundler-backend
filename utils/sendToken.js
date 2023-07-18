export const sendToken = (res, user, message, statusCode = 200) => {
    const token = user.getJWTToken();

    const options = {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
        httpOnly: true,
        secure: true,
        sameSite: "none",
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        message,
        user,
    });
};
