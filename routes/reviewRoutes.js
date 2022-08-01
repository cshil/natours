const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({mergeParams: true}); //To get access to the tourId param from the tourRouter. Each router only has access to the parameter of their specific routes.

router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user','admin'), reviewController.setTourAndUserIds,reviewController.createReview); 

router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'),reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'),reviewController.deleteReview);


module.exports = router;