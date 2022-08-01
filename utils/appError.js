// All of our AppError objects to inherit from the built in Error

class AppError extends Error {
    constructor(message, statusCode) {
      //When we extend a parent class, we call super, in order to call the parent constructor(Error). message is the only parameter the built in Error accepts
        super(message); //Calling Error. this.message will be set automatically

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor); //Function call will not be included in the stacktrace
    }
}

module.exports = AppError;