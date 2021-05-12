const CustomError = require("./CustomError");

function BadGateway(details = "Bad Gateway.") {
  this.value = 502;
  this.message = {
    title: "Bad Gateway",
    details
  };
}

BadGateway.prototype = Object.create(CustomError.prototype);
BadGateway.prototype.constructor = BadGateway;
module.exports = BadGateway;
