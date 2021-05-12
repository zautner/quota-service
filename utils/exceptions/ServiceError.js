const CustomError = require("./CustomError");

function ServiceError(details = "Service Error.") {
  this.value = 500;
  this.message = {
    title: "Service Error",
    details
  };
}

ServiceError.prototype = Object.create(CustomError.prototype);
ServiceError.prototype.constructor = ServiceError;
module.exports = ServiceError;
