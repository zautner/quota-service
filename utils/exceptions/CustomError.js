module.exports = class CustomError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this);
  }
};
