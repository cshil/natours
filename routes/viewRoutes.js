const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController=require('../controllers/bookingController');

const router = express.Router();

/*
Mount the router to the application
router.get('/', (req, res) => {
    res.status(200).render('base', {
        tour: 'The forest hiker',
        user: 'Jonas'
    }); //We can pass data to Pug by creating a object. This will be available as local object in the pug file
});
*/
//router.use(authController.loggedIn); //Users need to be logged in to access the below routes


router.get('/', bookingController.createBookingCheckout,authController.loggedIn,viewsController.getOverview)
router.get('/tour/:slug', authController.loggedIn,viewsController.getTour)
router.get('/login', authController.loggedIn,viewsController.getLoginForm)
router.get('/me', authController.protect, viewsController.getAccount)
router.get('/my-tours', authController.protect, viewsController.getMyTours)

//router.post('/submit-user-data', viewsController.updateUserData)


module.exports = router;