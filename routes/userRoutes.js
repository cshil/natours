const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Keep in mind the protect function is just really a middleware, they run in sequence, router we created is like a mini application, just like the regular app we can use middleware on the router as well.

router.use(authController.protect); //Protect all the routes that come after this point

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto , userController.updateMe); 
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin', 'user')); //This point on, the routes are restrcited to admins and users

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);
router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);


module.exports = router;