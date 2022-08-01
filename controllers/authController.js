const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        //passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    //JWT - Payload (id), sign with secret, give optional expires in parameter

    /*
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        //secure: true,
        httpOnly: true, //Cannot be accessed or modified by the browser
    })
    */
    //newUser.password = undefined; //To not show password in the output
    
    res.status(201).json({
        status: 'success',
        //token, //Send the JWT token
        data: {
            user: newUser,
        }
    })
    
});

exports.login = catchAsync(async (req, res, next) => {
    const email = req.body.email; //Since the property name is same as the variable name, we can utilize destructuring- const {email}=req.body
    const password = req.body.password;

    //1) Check if email and password exists

    if (!email || !password) {
        return next(new AppError('Please provide email and the password!', 400)); //Return so that the login functionality stops here
        
    }

    //2) Check if user exists && password is correct
    //The output of findone will not contain the password. Since we marked it as select: false in the userModel. We need password that is by default not selected, hence we use +. The password retrieved here is from the database

    const user = await User.findOne({ email: email }).select('+password');
    //const correct = await user.correctPassword(password, user.password); //Password is user inputted password, user.password is record in DB

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password!', 401));
    }

    const token = signToken(user._id);
    
    res.cookie('jwt', token, { //jwt is the name of the cookie. You can send the token as a cookie.
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        //secure: true,
        httpOnly: true, //Cannot be accessed or modified by the browser
    })
    

    //3) If Everything is ok, send token to the client
    
    res.status(200).json({
        status: 'success',
        token
    })
});

exports.logout = (req, res) => {
    res.clearCookie('jwt');
    /*
    res.cookie('jwt', 'loggedout', { //Same cookie name to override
        expires: new Date(Date.now() + 10 * 1000), //  10 seconds from now
        httpOnly: true
    })
    */
    res.status(200).json({
        status: 'success'
    })
}

exports.protect = catchAsync(async (req, res, next) => {
    
    //1. Getting token and checking if its there
    //const and let is block scoped. Hence the variable wont be available outside. Hence we declare the variable outside

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token=req.headers.authorization.split(' ')[1]; //Token coming from authorization header from the API
    } else if (req.cookies.jwt) {
        token=req.cookies.jwt //Token coming from cookie from the browser
    }
   
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401));
    }

    //2. verification token - If someone manipulated the token or if the token is expired
    //JWT verify is a synchronous function. We can promisify it to return a promise by using an inbuilt npm package named util. This will make it asynchronous through which we can use async/await
  
    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET); //If there is an error in verification, in the next() middleware the error will be passed down to the global error handling function
    //console.log(decoded);       

    //3. Check if user still exists. freshUser is the currentUser
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        //Anything passed into next parameter will invoke the flobal error handling function, in this case a new AppError object is passed to the global error handling function
        return next(new AppError('The user belonging to the token, no longer exists', 401));
    }

    //4. check if user changed password after token was issued
    //Instance methods are available on all user documents. The instance methods can be called here without exporting anything

    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed the password! Log in again', 401));
    };
    req.user = freshUser;
    res.locals.user = freshUser;
    next(); // Will go to the next route handler, that grants access to the protected route
})

//Middleware to check if users are logged in. This is only for rendered pages and there will be no errors!

exports.loggedIn = catchAsync(async (req, res, next) => {
    
    //1. Verify cookie
    
    if (req.cookies.jwt) {
        
            const decoded = await util.promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET); //Token coming from cookie from the browser
    

            //2. Check if user still exists. 
            const freshUser = await User.findById(decoded.id);
            if (!freshUser) {
                return next(); //We dont give an error instead we call the next middleware
            }

            //3. check if user changed password after token was issued
            //Instance methods are available on all user documents. The instance methods can be called here without exporting anything

            if (freshUser.changedPasswordAfter(decoded.iat)) {
                return next();//We dont give an error instead we call the next middleware
            };

            //There is a logged in user if none of the middleware stacks execute
            // We can put any variable in res.locals and our pug templates will get access to them. For example user is the variable, which will be accessible in pug
            res.locals.user = freshUser;
            //next(); // This is not needed, as we get cannot set header error, as the next() after the if block
            return next(); //next is only called once
        
    }
    next();
});

//Usually we cannot pass arguments into a middleware function. In this case, we want to pass in the roles on who are allowed to access the resource. Hence we create a wrapper function which will return the middleware function that we want to create. The wrapper function need to take arbitrary number of arguments, we can use the REST parameter syntax. This will create an array of all the arguments that were specified. 
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // The middleware function has access to the roles parameter due to function closure
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next(); //Next route to be accessed (deleteTour)
    }

}

exports.forgotPassword = catchAsync(async (req, res, next) => {

    //1) Get user based on posted email
    //console.log(req.body.email);
    const user = await User.findOne({ email: req.body.email });
    //console.log(user);
    if (!user) {
        return next(new AppError('There is no user with that email address', 404));
    }

    //2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    //console.log(resetToken);
    await user.save({validateBeforeSave: false}); //Save the modified changes to the DB. The special parameter within save, Deactivates all the valdiators specified in the schema

    //3) Send it back to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot Password? reset it ${resetURL}`;

    //sendEmail is an async function
 
    try {
           /*
    await sendEmail({
        email: user.email,
        subject: 'Your password reset token valid for 10 mins',
        message,
    })
    */
    await new Email(user, resetURL).sendPasswordReset()
        
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'

    })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was a error sending the email!', 500));
}

    
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires:{$gt: Date.now()}}); //If the password reset expires property is greater than right now, then the passwordResetExpires property is in the future which means it is not yet expired

    //2) If token has not expired, and user exists, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();  

    //3) Update the changedPasswordAt property for the user

    //4)Log the user in and send the JWT to the client
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        //secure: true,
        httpOnly: true, //Cannot be accessed or modified by the browser
    })

    res.status(200).json({
        status: 'success',
        token
    });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1) Get user from the collection

    const user = await User.findById(req.user.id).select('+password');
    //console.log(user);

    //2)Check if Posted password is correct

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong'), 401);
    }

    //3) If so, update the password

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //User.findByIdAndUpdate will not work as intended! Since Mongoose will not keep the password in memory

    //4) Log user in, Send JWT 

    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        //secure: true,
        httpOnly: true, //Cannot be accessed or modified by the browser
    })

    res.status(200).json({
        status: 'success',
        token,
    })

});