export const catchAsyncError = (passedFunction) => {
    return async (req, res, next) => {
        Promise.resolve(passedFunction(req, res, next)).catch(next);
    };
};
