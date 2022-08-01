const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
//const validator = require('validator');

//Create Mongoose schema


const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'], //Data validator
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have les or equal than 40 characters'], //Validator only available on strings
        minlength: [10, 'A tour must have more than 10 characters'], //Validator only available on strings
        //validate: validator.isAlpha, //npm validator method to check for only alphabets  
    },

    slug: String,

    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size'],
    },

    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty!'],
        enum: { //Validators only for strings
            values: ['easy', 'medium', 'difficult'],
            message: 'Specify the difficult level'
        }
    },

    rating: {
        type: Number,
        default: 4.5

    },

    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'], //Validators
        max: [5, 'Rating must be below 5.0'], //Validators
        //Setter function - Will run each time a new value is set for this field. A callback function receives the current value which we round it off.
        set: val => Math.round(val * 10) / 10 //4.66666 will be rounded to 4.7 with *10
    },

    ratingsQuantity: {
        type: Number,
        deafult: 0,
    },

    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },

    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) { //Custom Validators are simple functions which should return either true or false. We also have npm library called validators
                return val < this.price; //This keyword will only point to the current document when it is a new document. It doesnt work for update
            },
            message: 'Discount should be below regular price'
        }
    },

    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description'],
         
    },

    description: {
        type: String,
        trim: true,
    },

    imageCover: {
        type: String,
        //required: [true, 'A tour must have a cover image'],
    },

    images: [String], //An array with number of images (stored as string referenced in DB). The actual image will be in some filesystem

    createdAt: {
        type: Date,
        default: Date.now(),
        select: false, //To exclude the sensitive fields to be sent in the API response
    },

    startDates: [Date],

    secretTour: {
        type: Boolean,
        default: false,
    },

    //MongoDB supports geospatial data out of the box - Create as an object which will in turn have schema type options

    startLocation: {
        //geoJSON format
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: [Number], //Longitude, latitude
        address: String,
        description: String,
    },

    //Embedded documents (Denormalized data - reference within the document): Always use an array. By specifying array of object, this will create brand new documents inside the parent document (Tour) - Check in compass
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number,
        }
    ],

    //Referencing - Database doesnt hold the actual data. Query in tourmodel need to populate
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User', //Create a reference to another model. Effectively create a relationship between these two data sets
        }
    ],

},
   
    {
        toJSON: { virtuals: true }, //WHen the data gets outputted as JSON from DB, we need virtuals to be true
        toObject: { viruals: true } //WHen the data gets outputted as Object from DB, we need virtuals to be true
    });


// Set the indexes only for fields that are regularly accessed - Performance constraint (Only if there are a lot of reads)
//After the schema declaration. Indexes are stored outside the document collection in an ordered collection (Ascending/descending), hence when a query is shoot out it doesnt have to go through the entire document collection. We can create our own indexes as below

//tourSchema.index({ price: 1 }) //Single field index
tourSchema.index({ price: 1, ratingsAverage: -1 }) //compound index = 1 is the Ascending order and -1 is the descending order
tourSchema.index({ slug: 1 }); //We need to use unique slug to query for tours. Most queried field
tourSchema.index({startLocation: '2dsphere'}) //For geospatial data, index need to be a 2D sphere index (real point on the earth surface)

//Virtual properties (durationweeks) will not have persistance in DB. The virtual property here will be created everytime we get data out of the database 
tourSchema.virtual('durationweeks').get(function () { //Arrow function doesnt get its own this keyword. This runs whenever there is a get call to the DB
    return this.duration / 7;//this keyword points to the current processed document  
})

//Virtual populate for child referencing
tourSchema.virtual('reviews', {
    ref: 'Review',
    //Two fields - specify foreign field(Name of the field (tour) in the Review model where the reference to the current model is stored) and local field (Where the ID is actually stored in the current tour model)
    foreignField: 'tour', //tour id
    localField: '_id' //local tour id
})

//4 Types of middleware in mongoose - Docoment, query, aggregate and model. Just like in express, we can use mongoose middleware to make something happen between two events. Save command and actual saving for example. It can also be used before an event and after an event as well.
//Document middleware act on the currently processed document
//pre is pre event. Before the document is saved to the DB, the property gets added. Runs before the .save() and .create()
//save is a hook. It is a pre save hook or post save hook

tourSchema.pre('save', function (next) {
    //Create a new property called slug on the name
    this.slug = slugify(this.name, { lower: true }); //Slug property need to be part of schema
    next(); //To call the next middleware in the stack
});

//Embed user documents within tour: In schema mention as guides: array
/*
tourSchema.pre('save', async function (next) {
    const guidesPromises = this.guides.map(async id => await User.findById(id)) //guidesPromises now has array of promises which need to be run
    this.guides= await Promise.all(guidesPromises);//Overwrite the array of ID's with user documents
    next();
})
*/



//Post middleware functions are executed after pre middleware functions are completed
tourSchema.post('save', function (doc, next) {
    //console.log(doc);
    next();
   
})

//Query middleware runs before or after a certain query is executed. this keyword will point to the current query
//RE- Anything that starts with find

tourSchema.pre(/^find/, function (next) {
     //this is a query object, where we can chain all other methods
    this.find({ secretTour: { $ne: true } });
    next();
})

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides', //Populate the guides field to get the actual data
        select: '-__v -passwordChangedAt' //This will not be shown in the API response
    }); 
    next();
})

tourSchema.post(/^find/, function (docs,next) {
    //this is a query object, where we can chain all other methods
    //console.log(docs);
   next();
})

//AGGREGATION MIDDLEWARE - Before/After the aggregation is executed

/*
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //We use unshift to add an element at the beginning of an aggregate array. Shift at end of an array
    //console.log(this.pipeline()); //This will point to the current aggregation object array
    next();
});
*/



/*
tourSchema.pre('findOne', function (next) {
    //this is a query object, where we can chain all other methods
   this.find({ secretTour: { $ne: true } });
   next();
})
*/


//Create a Mongoose model - Visualize this as a class with which new objects can be created

const Tour = mongoose.model('Tour', tourSchema); 
module.exports = Tour;