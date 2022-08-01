// review/ rating/ createdAt/ ref to tour (Parent reference)/ ref to user (Parent reference)

const mongoose = require('mongoose');
const Tour = require('./tourModel');


const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!']
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },

        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        }
    },
    {
    toJSON: { virtuals: true }, //WHen the data gets outputted as JSON from DB, we need virtuals to be true
    toObject: { viruals: true } //WHen the data gets outputted as Object from DB, we need virtuals to be true
    }
);

//Unique index created. You cannot create two reviews coming from the same user
reviewSchema.index(
    {
        tour: 1, //Ascending order
        user:1 //Ascending order
    },
    {
        unique:true //Extra option. Each combination of tour and user always has to be unique
    }
)

//To populate the review - Parent referencing. Parent is tour, child is reviews

reviewSchema.pre(/^find/, function (next) {
    //this.populate({
    //    path: 'tour', //tour points to tour field in reviewSchema which is data populated based on the Tour model specified in the reference
    //    select: 'name',
    //})
        this.populate({
            path: 'user',
            select: 'name photo'
    })
    next();
})

//Statics method - named statics with a function named calcAverage. Remember instance method can be used on documents, static methods on the model


reviewSchema.statics.calcAverageRatings = async function (tourId) {
    //In a static method, this variable points to the current model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',//Common field all of the documents have is tour. Group all tours together by tour
                nRating: { $sum: 1 },//Add 1 to each tour that was matched
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    //console.log(stats);

    //Await the promise, else you will not get the result. Only if there is a document in the stats array
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId,
            {
                ratingsQuantity: stats[0].nRating,
                ratingsAverage: stats[0].avgRating
            }
        )
    } else {
        await Tour.findByIdAndUpdate(tourId,
            {
                ratingsQuantity: 0, //Default
                ratingsAverage: 4.5 //Default
            }
        )
    }   
}

//call the function from a middleware each time a new review is created. Use post so that all the collections are saved before calculating the average
//post doesnt get access to next variable
//Route automatically gets the tourID from the URL and userID from the currently logged in user
reviewSchema.post('save', function () {
    //This keyword points to the document currently being saved . We need to call calcAverageRating using this.tour(tour has the tourID)
    //function is available on the model - Review.calcAvegrageRatings. At this point Review variable is not yet defined. We cant move the code, as code runs in sequence.
    //this.constructor - points to the model. this is the current document, and constructor is the model that created the document
    this.constructor.calcAverageRatings(this.tour);
    
})

//Review is updated by findByIdAndUpdate and findByIdAndDelete. For these we will not have document middleware, but only query middleware. In the query we dont have direct access to the document, in order to use "this" keyword, because we need access to the current review to get the tour ID
//Trick to go around this limitation - RE - Strings starting with findOneAnd. findByIdUpdate and findByIDAndDelete behind the scenes is shorthand for findOneAndUpdate and findOneDelete

reviewSchema.pre(/^findOneAnd/, async function (next) {
    //this keyword is not the current document but the current query
    //console.log(this);
    //We can execute the query by using findOne which will give us the currently processed document
    //findOne gets the document from the database, in pre, there is no persistance to the database. We need tourID to calculate average rating. we cant use post because then the query would have been already executed
    this.r = await this.findOne(); //Save the document to this keyword to obtain it in post middleware
    //console.log(this.r);
    next();
})

reviewSchema.post(/^findOneAnd/, async function () {
    //Query has been executed. The tour ID can be obtained by passing data through "this" from the pre middleware to the post middleware. calcAverageRating is a static method, we need to call it on the model. this.r points to the cuurent document, from there we need to get the model
    await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

