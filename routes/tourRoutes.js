const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();

//Nested route
//POST /tours/234567f/reviews //Reviews is the child of tour. This is called nested route. There will be a request to this endpoint which will fetch the logged in user ID
//GET /tours/234567f/reviews/4567sdf9

//router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview);



router.use('/:tourId/reviews', reviewRouter);//Tourrouter should use reviewRouter in case it encounters a route like the below. Keep in mind router itself is a middleware, hence we can use the "use" method in it

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getTours); //Run a middleware for alias before executing the getTours handler.

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide', 'user'), tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
//2 ways of specifying it
// /tours-within?distance=233&center=40&unit=mi
// /tours-within/233/center/40,45/unit/miles - This is how we have specified which is cleaner

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getTours)
    .post(authController.protect,authController.restrictTo('admin', 'lead-guide', 'user'),tourController.newTour);

router
    .route('/:id')
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide', 'user'),tourController.uploadTourImages,tourController.resizeTourImages, tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide', 'user'), tourController.deleteTour)
    .get(tourController.getSingleTour);




module.exports = router;