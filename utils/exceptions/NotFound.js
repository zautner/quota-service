const CustomError = require("./CustomError");

function NotFound(details = "Entity not found.") {
  this.value = 404;
  this.message = {
    title: "Not Found",
    details
  };
}

NotFound.prototype = Object.create(CustomError.prototype);
NotFound.prototype.constructor = NotFound;
module.exports = NotFound;
