class APIfeatures {
    //Constructor function gets automatically called as soon as we create a new object out of this class.  The new object that will call the constructor function will have access to the "this" keyword. 
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

module.exports = APIfeatures;