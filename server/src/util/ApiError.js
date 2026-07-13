class ApiError extends Error {
    constructor( 
        statuscode ,
        message = "Something went wrong",
        errors = { name: `Code Red MF!! ${statuscode}`, message: message},
        stack = null
    ) {
        super(message)
        this.statuscode = statuscode;
        this.errors = errors;
        this.success = false;

        if(stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default ApiError;