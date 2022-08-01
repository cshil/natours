const Tour = require('../models/tourModel');
const Booking=require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
//const factory=require('./handlerFactory');

exports.getOverview = catchAsync(async (req, res, next) => {
    
    //1) Get tour data from collection
    const tours = await Tour.find();
     
    //2) Build the template - In overview.png

    //3) Render that template using tour data from 1)

    res.status(200).render('overview', {
        title: 'All Tours',
        tours //This is an array since it contains multiple tour documents. This variable can be passed to pug template
    })
});

exports.getTour = catchAsync(async (req, res,next) => {
    
    //1) Get the data for the requested tour (Including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name!', 404))
    }

    //2) Build the template in tour.pug

    //3) Render the template using data from 1)


    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
});

//Render a login template
exports.getLoginForm =  (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    })
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
}

exports.getMyTours = catchAsync(async (req, res, next) => {
    //1) Find all bookings documents for the currently logged in user
    const bookings = await Booking.find({ user: req.user.id });

    //2) Find tours with the returned booking ID's. map returns an array of tourID's
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } }); // Query finds all the tours which have an _id, which is $in the tourIDs array
    
    res.status(200).render('overview', {
        title: 'My tours',
        tours
    })

});



