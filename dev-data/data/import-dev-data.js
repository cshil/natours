//Start a server
const fs = require('fs'); //To read the data
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel'); //To write the data
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

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

//Read JSON file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //Conert JSON to javascript object using JSON.parse. We will array of javascript objects.  . looks at home folder (Where the node application was started), whereas dir name is available to us everywhere
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//Import data into database

const importData = async () => {
    try {
        //Create document for each of the objects in the array. create method accepts array as well as a single object
        await Tour.create(tours);
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Data successfully loaded!');
     
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

//Delete data from DB

const deleteData = async () => {
    try {
        //Create document for each of the objects in the array. create method accepts array as well as a single object
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted!')
    } catch (err) {
        console.log(err);
    }  
    process.exit();
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv); //Array of running the node process in terminal. node dev-data/data/import-dev-data.js --import. Node is first array object, path is second array object, --import or --delete is third object, based on third object the function will be called



