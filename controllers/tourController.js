const { query } = require('express');
const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIfeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./handlerFactory');
const multer = require('multer'); //Middleware for multi part upload
const sharp = require('sharp'); //Imgae processing library for node JS
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)); //JSON.parse will convert the JSon file into an array of javascript objects. Send the response in JSEND format where data is the envelope. /.. is to exit the routes folder and go up one folder to main folder where the tours-simple.json file exists.

//Input validation middleware before hitting the handler. Add this middleware in the router before hitting the handler in tourRoutes.js

/*
exports.checkBody = (req, res, next) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing name or price',
        })
    }
    next();
 
}
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

//Middleware for uploading multiple images with multiple fields

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 }, //We can have only have one field for imageCover
    {name: 'images', maxCount: 3},
])

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    //console.log(req.files);

    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image

    const imageCoverFilename= `tour-${req.params.id}-${Date.now()}-cover.jpeg`

    await sharp(req.files.imageCover[0].buffer) //buffer is the memory representation of the image. Look in console.log(req.files)
        .resize(2000, 1333) //Width, Height
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageCoverFilename}`);
    
    req.body.imageCover = imageCoverFilename; //req.body.imageCover is as per our Schema definition. Put imageCoverFilename on req.body per the handler function

    //2) Images
    req.body.images=[] //Per the schema
    //req.files.images.foreach(async (file, i) => { //Async await inside loop will not work. Instead use map to get an array of promises and await them using promise.all and only after the processing move to the next middleware
    await Promise.all(req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`

        await sharp(file.buffer) //buffer is the memory representation of the image. Look in console.log(req.files)
            .resize(2000, 1333) //Width, Height
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);
        
        req.body.images.push(filename);
        
        
    }));
    
    next();
});

//For single field: upload.single('image) . Available in req.file
//For multiple images: upload.array('images',5). Available in req.files
//For both (Mix), it is upload.fields as used above

exports.aliasTopTours = (req, res, next) => {
    //Prefilling query
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}
/*
class APIfeatures {
    //This is a function that gets automatically called as soon as we create a new object out of this class.  When you create your constructor function, you can use the “this” keyword to reference the object that WILL be created when the constructor is instantiated.
    constructor(mongoQuery, reqquery) { 
        //console.log(reqquery)
        this.query = mongoQuery;
        this.queryString = reqquery;
    }
    
    filter() {
        const queryObj = { ...this.queryString }; 
        console.log(queryObj);
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) 
        this.query=this.query.find(JSON.parse(queryStr)); //The find method result is stored on this.query
        return this; //Returns the entire object
    }   

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' '); //Split will give an array of all splitted strings. Mongo excepts a space
            this.query = this.query.sort(sortBy);
            //Mongo command: sort('price ratingsAverage')
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            //Mongo Query
            //query=query.select('name duration ratingsAverage')
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');//__v is an internal variable used by mongo. We can stop sending it to the client. DO not disable it sicne mongo use the variable internally
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1; //*1 will convert to a number. If nothing is specified, default page is 1
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;//page is the current page the user requests. We subract 1 from the current page and skip all the results until the subracted value * limit.

        //Example: Page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}
*/

exports.getTours = factory.getAll(Tour);

/*
exports.getTours = async (req, res) => { 
    try {
        console.log(req.query);
        const features = new APIfeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const tours = await features.query;
        res.status(200).json({
            status: 'success',
            //Time: req.requestTime,
            results: tours.length, //If multiple objects are sent
            data: {
                tours, //Key tours is the resource name, value tours is the data
            }
        })
    } catch (err) {
        res.status(400).json({
            status: 'Fail',
            message: err
        });
    }

*/
        

//Creating a new object from the class. Basically creating an instance of APIfeatures that will get stored in features variable. Features variable will have access to all the methods we define in the class definition. We create the mongoQuery using Tour.find(), and query string which we get from express is req.query passed as parameters to the class
//}
/*
exports.getTours = async (req, res) => {
    try {
        //BUILD THE QUERY
        //1) Filtering
        const queryObj = { ...req.query }; //IN JS when we set a variable to another object, that variable will basically be a reference to the original object. Changing queryObj will also change req.query. We need a hard copy here, hence we use destructuring. ... will basically take all the fields out of the object and with the curly braces, a new object is created that will contain all the key value pairs that were in our req.query object.
        //console.log(queryObj);
        
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);
    //Use find method on the database model to get all the data
    //console.log(req.query);//Express way of parsing the query parametes into an object
        //console.log(queryObj);

        //2) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) //callback has the matched string. Return from the callback the new string that will replace the old one. If the query from postman contains advanced operators Eg: {difficulty: 'easy',duration:{$gte:5}}. In mongoose we need $ sign 

        let query = Tour.find(JSON.parse(queryStr)); //Find method returns an array of all the documents. queryObj returns a query. We use await, so our query will execute and come back with document that matches the query. Hence chain all the query methods such as sort, pagination etc and then await for the final document.
        
        //3) SORTING

        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' '); //Split will give an array of all splitted strings. Mongo excepts a space
            query = query.sort(sortBy);
            //Mongo command: sort('price ratingsAverage')
        } else {
            query = query.sort('-createdAt');
        }

        //4) Limiting fields

        if (req.query.fields) {
            //Mongo Query
            //query=query.select('name duration ratingsAverage')
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');//__v is an internal variable used by mongo. We can stop sending it to the client. DO not disable it sicne mongo use the variable internally
        }

        //5) Pagination
        const page = req.query.page * 1 || 1; //*1 will convert to a number. If nothing is specified, default page is 1
        const limit = req.query.limit * 1 || 10;
        const skip = (page - 1) * limit;//page is the current page the user requests. We subract 1 from the current page and skip all the results until the subracted value * limit.

        //Example: Page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3

        query = query.skip(skip).limit(limit);

        if (req.query.page) {
            const numTours = await Tour.countDocuments(); //countDocuments method in mongo returns a promise whose value conatins the total number of documents
            if (skip >= numTours) throw new Error('This page does not exist');
        }
        
        //EXECUTE QUERY - Each of the query will always return a query which we can chain on with next mthod and the next method and await the final query
        
        const tours = await query;
      
        //SEND FINAL RESPONSE
    res.status(200).json({  
        status: 'success',
        //Time: req.requestTime,
        results: tours.length, //If multiple objects are sent
        data: {
            tours, //Key tours is the resource name, value tours is the data
        }
    });
} catch (err) {
    res.status(400).json({
        status: 'Fail',
        message: err
    });
  
}
}
*/

exports.getSingleTour = factory.getOne(Tour, { path: 'reviews' }); //.populate('reviews'); path will check the virtual populate in tourModel

/*
exports.getSingleTour = async (req, res) => {
    try {
        //id is the parameter value specified in router. req.params will have the url parameter. Populate replaces the guide ID's with actual data.
        const tour = await Tour.findById(req.params.id).populate('reviews');
        res.status(200).json({  
            status: 'success',
            data: {
                tour
            }
        }); 

        /* Implement wrapping as done in newTour and then enable this code. As soon as next receives some parameter, it assumes it is an error, and will jump straight into the global error handling middleware which will hen send the response for us. 
        if (!tour) {
            return next(new AppError('No tour found with that ID', 404));
    }
    */
   /*
    } catch (err) {
        res.status(400).json({
            status: 'Fail',
            message: err
        });
    
    }
 */
    
    
    //After : id and x is the variable in the URL parameter. x is optional
    //console.log(req.params);// All the parameters of all the variables that we define are stored. req.params is a very nice object that automatically assigns the value to our variable.
    //const id = req.params.id * 1; //To convert string to a number
    /*
    if (id > tours.length) {
        return res.status(401).json({
            status: fail,
            message: 'Invalid ID',
        })
    }

    const tour = tours.find(el => el.id === id); //Find will loop through the array and in each of the iteration, we will have access to the current element and we will return either true or false in each iteration. Find method will create an array which only contains the element where the comparison turned out to be true.
    res.status(200).json({  
        status: 'success',
        data: {
            tours: tour, //Key tours is the resource name, value tours is the data
        }
    });
    */
   
//}

exports.updateTour = factory.updateOne(Tour);

/*

exports.updateTour = async (req, res) => {
    try {
        const tour= await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, //Options come form mongoose . Read the document. new returns the new document
            runValidators: true // Validators are run against the schema for updateTour
        })
        res.status(200).json({
            status: 'Success',
            data: {
                tour
            }
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message:err
        })      
}

    /*
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID',
        })
    }*/
//Patch logic: Get tour from JSON file, change the tour and then save it back to the file  
/*
}
*/

exports.deleteTour = factory.deleteOne(Tour);

/*
exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'Success',
            data: null, //To indicate data is deleted
        })     
    } catch (err) {
        res.status(401).json({
            status: 'Fail',
            Message: 'Invalid ID',
        })
    }
    /*
    if (req.params.id > tours.length) {
        res.status(401).json({
            status: 'Fail',
            Message: 'Invalid ID',
        })
 
    }*/
    /*
}
*/

//catch Asyn should wait until express calls it. express will call it as soon as someone hits the route. catchasync function should return an another anonymous function which will then be assigned to newTour. This anonymous function will call the initial function passed intially when the route is hit.
//Async functions returns promises. If there is an error promise gets rejected. The catch will pass the error to the next function which will make the error end up in global error handling

exports.newTour = factory.createOne(Tour);

/*

exports.newTour = catchAsync(async (req, res, next) => { //next is needed to pass the error into it, which can be handled in the global error handling middleware
    //try {
        //console.log(req.body);
        //const newId = tours[tours.length - 1].id + 1; //For POST request ID need to be created. Take the last ID and add 1 to it
        //const newTour = Object.assign({ id: newId }, req.body); //Object.assign allows us to create new object by merging to existing object together
        //tours.push(newTour);
        //To persist the data on the file
        //fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
    
        //create method is used on the model directly
        const newTour = await Tour.create(req.body); //Returned promise value gives access to the final document created on the database

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }
        })
        //})
    //} catch (err) {
    //    res.status(400).json({
    //        status: 'Fail',
    //        message: err,
    //   })
    //}
});
*/

exports.getTourStats = async (req, res) => {
    try {
        //Aggregation pipeline is a MongoDB feature. Mongoose gives us access to it, so that we can use it in the mongoose driver
        //Aggregate pipeline is like a regular query. Using a aggregation pipeline we can manipulate data in couple of different steps.
        //agregate returns an aggregate object
        //Ensure to read Mongo DB documentation on aggregation pipeline
        const stats = await Tour.aggregate([
            {
                $match: { ratingsAverage: { $gte: 4.5 } }
            },
            {
                $group: {
                    //_id: '$null', //To get all fields
                    _id: '$difficulty', //We can group our results for different fields
                    numTours:{$sum: 1}, //TO calculate number of tours, For each of the document that goes through this aggregation pipeline, 1 will be added to the numTours counter
                    numRatings:{$sum: '$ratingsQuantity'},
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    minPrice: { $max: '$price' },
                }
            },
            {
                $sort:{avgPrice:1}

            },
            //{
            //    $match: {_id:{$ne:'easy'}},
            //}
        ]);
        res.status(200).json({
            status: 'Success',
            data: {
                stats
            }
        })
        
    } catch (err) {
        res.status(400).json({
            status: 'Fail',
            message: err,
        })
    }
}

exports.getMonthlyPlan = async (req, res) => {
    try {
        const year = req.params.year * 1; //2021
        const plan = await Tour.aggregate([
            {
                //Unwind will deconstruct an array field from the input document and then output one document for each element of the array. Example: We want to have one tour for each of these dates in the array. The field with the array that we want to unwind is startdates
                $unwind:'$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),  //Want our date to be greater or equal to Jan 01st
                        $lte: new Date(`${year}-12-31`), //Want our date to be lesser or equal to Dec 31st
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStarts: { $sum: 1 },
                    tours:{$push: '$name'}, //To create an array of one or more tours
                    
                }
            },
            {
                $addFields:{month:'$_id'}
            },
            {
                $project: {
                    _id:0 //0 would not show up, 1 would show up
                }
            },
            {
                $sort: {numTourStarts: -1}
            },
            {
                $limit: 6
            }
        ]);

        res.status(200).json({
            status: 'Success',
            data: {
                plan
            }
        })
       
    }
    
    catch (err) {
        res.status(400).json({
        status: 'Fail',
        message: err,
        })
    }
}
// /tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/233/center/40,45/unit/miles - This is how we have specified which is cleaner

exports.getToursWithin = catchAsync(async (req, res, next) => {
    //Destructure to get all the request parameters 
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(','); //split creates an array of two elements. latlng will be a string
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // radius of earth is 3963.2 in miles and 6378.1 in kms. This is a special unit called radiance which mongo DB expects
    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng'), 400);
    }
    //console.log(distance, lat, lng, unit);

    //We have to query for start lcoation, because start location is what holds the geospatial point, where each tour starts. Specify the value we are searching for, for that we use geospatial operator geowithin. This operator finds documents within a certain geometry. The geometry need to be specified as a sphere (lat lng) and which has the radius (distance)     
    const tours = await Tour.find( { startLocation: { $geoWithin: { $centerSphere: [ [ lng, lat], radius ] } } } );

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(','); //split creates an array of two elements. latlng will be a string

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001; //metre to miles conversion
    
    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng'), 400);
    }

    const distances = await Tour.aggregate(
        [
            {
                //geoNear should be the first stage in the aggregation pipeline
                //For geoNear there need to be one geospatial index (Which we have as starting location) which will be taken into account automatically. If we have multiple geospatial indexes, then we might have to specify the key parameter
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [lng *1 , lat *1 ] //Multiply by 1 to convert to numbers
                    },
                    distanceField: 'distance',
                    distanceMultiplier: multiplier
                }
            },
            {
                //Names of the field that we want to see in the output
                $project: {
                    distance: 1,
                    name: 1
                }
            }
        ]
    );

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
});


    