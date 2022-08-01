/*
const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)); //JSON.parse will convert the JSon file into an array of javascript objects. Send the response in JSEND format where data is the envelope

const getTours=(req, res) => {
    res.status(200).json({  
        status: 'success',
        Time: req.requestTime,
        results: tours.length, //If multiple objects are sent
        data: {
            tours: tours, //Key tours is the resource name, value tours is the data
        }
    });
}

const getSingleTour=(req, res) => { //After : id and x is the variable in the URL parameter. x is optional
    console.log(req.params);// All the parameters of all the variables that we define are stored. req.params is a very nice object that automatically assigns the value to our variable.
    const id = req.params.id * 1; //To convert string to a number

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
}

const updateTour=(req, res) => {
    if (req.params.id * 1 > tours.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID',
        })
    }
//Patch logic: Get tour from JSON file, change the tour and then save it back to the file
    
    res.status(200).json({
        status: 'Success',
        data: {
            tour: '<Updated tour here>',
        }
    })
}

const deleteTour=(req, res) => {
    if (req.params.id > tours.length) {
        res.status(401).json({
            status: 'Fail',
            Message: 'Invalid ID',
        })
    }

    res.status(204).json({
        status: 'Success',
        data: null, //To indicate data is deleted
    })
}

const newTour=(req, res) => {
    console.log(req.body);
    const newId = tours[tours.length - 1].id + 1; //For POST request ID need to be created. Take the last ID and add 1 to it
    const newTour = Object.assign({ id: newId }, req.body); //Object.assign allows us to create new object by merging to existing object together
    tours.push(newTour);
    //To persist the data on the file
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }
        })
    })
}

const getAllUsers = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This route is not yet defined',
    })
}

const getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This route is not yet defined',
    })
}

const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This route is not yet defined',
    })
}

const updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This route is not yet defined',
    })
}

const deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This route is not yet defined',
    })
}
*/

//A new Router - tourRouter is a middleware. We want to use the middleware for the specific route. When there is a request for /api/v1/tours/3. The incoming request goes into the middleware stack and when it hits this line of code, it will match the URL, therefore tourRouter middleware function will run. tourRouter is the below sub application we created which in turn has its own routes. The request was for /:id, so it will hit that specific mini app and finally it will run one of the handlers

//Parameter middleware - val holds the parameter value.
//In these midddlewares, We can do various input validations here if the parameter is valid one, regular expressions etc
//We can also create our own middlewares to check the body content, to contain specific properties only
//.post(middleware,newTour) - WHen a route hits the handler, it will first run the middleware function for the validations and then create the tour
//We chain multiple handlers for same route, we can check if a user is logged in, Or if they have the privileges, access rights to create new tour, All kinds of checks before the tour is actually created

/*
tourRouter.param('id', (req, res, next, val) => {
    console.log(`Tour id is ${val}`);
    next();
})
*/

/*
const tourRouter = express.Router();
const userRouter = express.Router();

tourRouter
    .route('/')
    .get(getTours)
    .post(newTour);

tourRouter
    .route('/:id')
    .patch(updateTour)
    .delete(deleteTour)
    .get(getSingleTour);

userRouter
    .route('/')
    .get(getAllUsers)
    .post(createUser);
userRouter
    .route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

    */

 


//////////////////////////////////////////////////Alternative way//////////////////////////////////////////////////////////////

//Always mention the version of the API, so that if there any changes in the future, a new version of the API can be used.

/*
app.get('/api/v1/tours', getTours); 
app.get('/api/v1/tours/:id/:x?', getSingleTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);
app.post('/api/v1/tours', newTour);
*/

//Alternative way of writing the same, to ensure changes if any on routes or versions are done at minimal places

/*
app.route('/api/v1/tours').get(getTours).post(newTour);
app.route('/api/v1/tours/:id').patch(updateTour).delete(deleteTour).get(getSingleTour);
*/

//users route
/*
app.get('/api/v1/users', getAllUsers);
app.post('/api/v1/users', createUser);
app.get('/api/v1/users/:id', getUser);
app.patch('/api/v1/users/:id', updateUser);
app.delete('/api/v1/users/:id', deleteUser);
*/

//app.route('/api/v1/users').get(getAllUsers).post(createUser);
//app.route('/api/v1/users/:id').get(getUser).patch(updateUser).delete(deleteUser);


//console.log(process.env); //NodeJS sets a bunch of environment variables
/*
const port = 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});
*/