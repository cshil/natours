const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIfeatures = require('./../utils/apiFeatures');

//Handler functions are functions that return another function
//This works because of javascript closures, where the inner function gets access to the variables of the outer function even after the outer function has already returned

exports.deleteOne = Model => catchAsync(async (req, res, next)=>{
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
        status: 'Success',
        data: null, //To indicate data is deleted
    });
});

exports.updateOne=Model=>catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true, //Options come form mongoose . Read the document. new returns the new document
        runValidators: true // Validators are run against the schema for updateTour
    })

    if (!doc) {
        return next(new AppError('No document found with that ID', 400));
    }

    res.status(200).json({
        status: 'Success',
        data: {
            data: doc
        }
    })
});

exports.createOne = Model => catchAsync(async (req, res, next) => {  
    const doc = await Model.create(req.body); 

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    })
});

exports.getOne = (Model, populateOption) => catchAsync(async (req, res, next) => {
    //id is the parameter value specified in router. req.params will have the url parameter. Populate replaces the guide ID's with actual data.
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption)
    const doc = await query;
    if (!doc) {
        return next(new AppError('No document with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res) => {
    
        //To Allow for nested GET Reviews on Tour (small hack)
    
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };
    
        const features = new APIfeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
    //const doc = await features.query.explain(); //Explain is used to get the query statistics
      const doc = await features.query;
        res.status(200).json({
            status: 'success',
            //Time: req.requestTime,
            results: doc.length, //If multiple objects are sent
            data: {
                data: doc, //Key tours is the resource name, value tours is the data
            }
        })
})
    







