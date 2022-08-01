const { fail } = require('assert');
const fs = require('fs');
const path = require('path'); //To manipulate path names
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); //dotenv is a npm package to be installed
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter=require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const cookieParser = require('cookie-parser');//In order to get access to the cookies in the request, we need a middleware in express. cookie-parser will parse all the cookies from the incoming request


const app = express(); // use method is what we use to actually use middleware. Add middleware to our middleware stack.

//Template engine to fill up the content. Install pug using npm.

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')) // This will behind the scenes, create a path joining the directory name/views. Using path module node will automatically create a correct path


//GLOBAL MIDDLEWARES

//To server static files from a folder, and not from a route. Use a built in middleware function named static. We pass the directory where we have stored our static files. If we open a URL, and the app cant find it in any of the routes, it will look into the public folder we defined. Specify 127.0.0.1:3000/overview.html or CSS stylesheets

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set Security HTTP headers - helmet is a NPM package. Good number of header collections in NPM github document
app.use(helmet())

//Development logging
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'));//Calling morgan function will return a function similar to the one below with req,res and next. It will log the request to the console.
}

//Limit requests from same API
const limiter = rateLimit({
    max: 100, //How many requests per IP
    windowMs: 60 * 60 * 1000, //100 requests per hour
    message: 'Too many requests from this IP, Please try again later'
});
app.use('/api', limiter); //Affect all of the routes that start with url /api

//Middleware to modify incoming request data. The data is not added to the request object directly by express. The data from the body is added to the request object by the middleware

//Body parser, reading data from the body into req.body
//Parses data from body
app.use(express.json({ limit: '10kb' })); //calling this json method, basically returns a function, and that function is added to the middleware stack. We can create our own middleware function and add it to the middleware stack. Evry middleware function has access to req, res pair and next function
app.use(cookieParser());

//Once the data is read into req.body, clean the data

//Data sanitization against noSQL query injection
app.use(mongoSanitize()); //Filter all $ signs and . That is how mongoDB operators are written and by removing them the operators are no longer going to work

//Data Sanitization against cross site scripting attacks
app.use(xss());//This will clean any user input from malicious HTML code with javascript code attached to it. Convert all the malicious symbol to safe ones. Mongo validators can in fact protect server side XSS. Custom validations can be built by using the mongo validators in the middleware. Mongoose provides a strict schema

//Prevent Parameter pollution (Removing duplicate parameters). Use it at the end as it clears up the queryString

app.use(hpp({
    whitelist: [
        'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price' //Allow duplicates in query string
    ]
}));



//The order of the middleware code matters a lot! If it is called after a route, which is a middleware by itself. And if the route handler finishes the req-res cycle, then the custom middleware wont execute.

// TEST middleware
app.use((req, res, next) => {
    //console.log(req.cookies);
    next(); //If we dont call next, we will be stuck at the request-response cycle.
})

//Middleware can also be used to manipulate the request/response objects

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    next();
})

//Build an API route handler
//Rememeber all midleware functions are executed in the order they are in the code. If our code comes till this point, and none of the routers (tour or user) was able to catch it. Adding middleware here will be reached if it is not handled by any of our routers.


//ROUTES
//Render the template to the browser
/*
app.get('/', (req, res) => {
    res.status(200).render('base', {
        tour: 'The forest hiker',
        user: 'Jonas'
    }); //We can pass data to Pug by creating a object. This will be available as local object in the pug file
});

app.get('/overview', (req, res) => {
    res.status(200).render('overview', {
        title: 'All Tours'
    })
})

app.get('/tour', (req, res) => {
    res.status(200).render('tour', {
        title: 'The forest hiker Tour'
    })
})
*/

//ROUTES

app.use('/', viewRouter);
app.use('/tour', viewRouter);
app.use('/api/v1/tours', tourRouter); 
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Middleware - all runs for all the HTTP methods, * stabds for all the routes not handled by tourRouter or userRouter
app.all('*', (req, res, next) => {
    //res.status(404).json({
    //    status: 'fail',
    //    message: `Cant find ${req.originalUrl} on this server!`,
    //})  

    //const err = new Error(`Cant find ${req.originalUrl} on this server!`);
    //err.status = 'fail';
    //err.statusCode = 404;
    next(new AppError (`Cant find ${req.originalUrl} on this server!`, 400)); //Whenever a argument is passed to the next , express automatically will call global middleware error handling function and skip all other middlewares    
})

//Express comes with error handling middleware functions out of the box. When we give 4 arguments express will automatically recognize it as error handling middleware.


app.use(globalErrorHandler);


//Start a server

module.exports = app;