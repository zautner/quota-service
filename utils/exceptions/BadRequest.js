const CustomError = require("./CustomError");

function BadGateway(details = "Bad Gateway.") {
  this.value = 400;
  this.message = {
    title: "Bad Request",
    details
  };
}

BadGateway.prototype = Object.create(CustomError.prototype);
BadGateway.prototype.constructor = BadGateway;
module.exports = BadGateway;
