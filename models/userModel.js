const crypto = require('crypto'); //Built in node module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//Create a Schema and create a model out of it
//name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
    },

    email: {
        type: String,
        required: [true, 'Please provide your email!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']

    },

    photo: {
        type: String,
        default: 'default.jpg'
    },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },

    password: {
        type: String,
        required: [true, 'Please provide a password!'],
        minlength: 8,
        select: false, //Password will not show up in any output
    },

    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            //This only works on CREATE and SAVE!!
            validator: function (el) {
                return el === this.password; //Returns true or false
            },
            message: 'Passwords are not the same!'
        }
    },

    passwordChangedAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,

    active: {
        type: Boolean,
        default: true,
        select: false,
    }

});

//Encryption: Pre save middleware defined on the schema. The middleware function will happen between the moment that we receive the data and the moment where it is actually persisted to the database.
//pre (Something that will happen before a query) - Middleware function for every query that starts with save


userSchema.pre('save', async function (next) {
//this refers to the current user document. Only run the function if password was actually modified
    if (!this.isModified('password')) return next();
//Encrypt or hash. hash is an async version
    this.password = await bcrypt.hash(this.password, 12); //cost of 12 - CPU intensive 
    this.passwordConfirm = undefined; //Delete this field in database
    next();
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next(); //If the password is modified or if the document is new, exit and return to next middleware
    this.passwordChangedAt = Date.now() - 1000; //Token might have been created before passwordChangedAt timestamp. Fix it by subtracting it by 1 second. This will ensure token is created after the password has been changed
    next();
})


//Query middleware - pre (Something that will happen before a query) - Middleware function for every query that starts with find
//For example during getallusers, there is a find query, before the query is executed we want to add something to it which is, we only want to find documents with the active property set to true

userSchema.pre(/^find/, function (next) {
    //this points to the current query
    this.find({ active: {$ne: false} }); //All documents with active not equal to false
    next();
})

//Instance method - Available on all documents (users) of a certain collection. The this keyword in the instance method will always point to the current document

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); //Convert to milliseconds and specify the base 10
        //console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp; //Example: Token was issued at time 100, password was changed at time 200 (100 < 200). We changed password after the token was issued. so this is true
    }
    return false; //Not changed. 
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex'); //Clear one will be sent to user via email

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); //Hash to store in DB

    //console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}



const User = mongoose.model('User', userSchema);
module.exports = User;


