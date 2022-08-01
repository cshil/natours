//Stripe exposes a function and we pass our secreet key right into that , which will give us a stripe object to work with
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../models/tourModel');
const catchAsync=require('../utils/catchAsync')
const appError=require('../utils/appError')
const factory = require('./handlerFactory');
const Booking=require('../models/bookingModel');



exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourID); 

    //2) Create checkout session - Install stripe npm package
    const session = await stripe.checkout.sessions.create({ //create returns a promise, as below all are api calls to stripe
        //Session info
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,//Home page
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email, //protected route, hence user is already on the request
        client_reference_id: req.params.tourID, //custom field
        //Product info
        line_items: [{
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            amount: tour.price * 100,
            currency: 'usd',
            quantity: 1
        }]

    })


    //3) Create session as response and send it to client
    res.status(200).json({
        status: 'success',
        session
    })
    
});

//Create new booking in the database

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    //This is temporary solution since it is not very secure. Everyone can make bookings without paying
    //console.log(req.query);
    const { tour, user, price } = req.query
    
    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price })

    res.redirect(req.originalUrl.split('?')[0]);
    
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);