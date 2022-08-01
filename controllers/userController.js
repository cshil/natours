const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer'); //Middleware for multi part upload
const sharp = require('sharp'); //Imgae processing library for node JS

/*
//Store our files - //- File is uploaded to the destination folder
const multerStorage=multer.diskStorage({
    //callBack is similar to next in express
    destination: (req, file, callBack) => {
        callBack(null, 'public/img/users') //If there is no error, then it is null for first argument, else there will be error
    },
    //Set the unique filename   
    filename: (req, file, callBack) => {
        //user-userID-Timestamp
        const ext = file.mimetype.split('/')[1];
        callBack(null, `user-${req.user.id}-${Date.now()}.${ext}` )
    }
})
*/

//save the file to memory or buffer
const multerStorage=multer.memoryStorage();

//Do not allow files that are not images
const multerFilter = (req, file, callBack) => {
    if (file.mimetype.startsWith('image')) {
        callBack(null, true);
    } else {
        callBack(new AppError('Not an image! Please upload only images', 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter  
}); 

exports.uploadUserPhoto = upload.single('photo') //Upload single file with the field name photo. Upload the file using form-data under body in API. The body parser will not be able to read the files

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    //File in memory. sharp method will create an object on which we can call multiple methods. 500, 500 is for square
    //Filename will not be set in memory

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);
    
    next();
});

//REST parameter takes in all of the parameters passed in and creates an array
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    //Object.keys loops through an object in javascript. This returns an array of all the key names
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    })
    return newObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id; //req.params.id Used by the handler function getOne
    next();
}

exports.updateMe = catchAsync(async (req, res, next) => {

    //console.log(req.file);
    //console.log(req.body);
    //1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
    }

    //2) Update user document. findByIdAndUpdate is used since we are dealing with non sensitive data and all fields are not required only few fields that are needed to update.
    //If someone provides req.body.role: 'admin'. This will lead to escalation of privilege. Only provide fields that need to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true //If we enter invalid email address for example
    })
    res.status(200).json({
        status: 'success',
        data: {
            user:updatedUser,
        }
    })   
});

exports.deleteMe = async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false })

    res.status(204).json({
        status: 'success',
        data: null
    })    
}



exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This route is not yet defined. Please use /signup instead' ,
    })
}

exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

//Do not update PASSWORDS with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);