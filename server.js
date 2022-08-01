//Start a server
const mongoose = require('mongoose');
const app = require('./app');

//clconsole.log(process.env); //All node env variables will be present here

const DB=process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
mongoose.connect(DB, {
    useNewUrlParser: true, //To deal with deprecation warnings
    usecreateIndex: true,
    useFindAndModify: false, //To deal with deprecation warnings
    useUnifiedTopology: true //To deal with deprecation warnings
}).then(con => { //.connect returns a promise which need to be handled. We get access to the connection variable which we can take a look at
    //console.log(con.connections);
    console.log('DB connection successful!');
})

/*
//Create Mongoose schema

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true
       
    },
    rating: {
        type: Number,
        default: 4.5

    },
    price: {
        type: Number,
        required:[true, 'A tour must have a price']
    }
})

//Create a Mongoose model - Visualize this as a class with which new objects can be created

const Tour = mongoose.model('Tour', tourSchema); 

//Create new documents(Objects) from the model - Visualize as creating new object instances from the class. testTour will have coupl eof methods on it to interact with the database

const testTour = new Tour({
    name: 'The forest hiker',
    rating: 4.7,
    price: 497
  
})

testTour.save().then(doc => {
    console.log(doc);
}).catch(err => {
    console.log('ERROR', err);
}) //Save will return a promise which we can consume. Return value of the promise is the final document
*/

const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

//Safety net for all other unhandled rejections in Asynchronous code
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    //process.exit(1);
})

//safety net for all uncaught exceptions in synchronous code

process.on('uncaughtException', err => {
    console.log(err);
    //process.exit(1);
})