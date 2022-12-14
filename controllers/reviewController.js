const Review = require('./../models/reviewModel'); 
//const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

/*
exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };//If tourId is specified, then review equal to specified req.params.tourId will be fetched. If it is not specified, then all reviews will be fetched
    const reviews = await Review.find(filter);
    
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews,
        }
    })
    
});
*/

exports.setTourAndUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id; //req.user comes from the protect middleware
    next();
}

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);