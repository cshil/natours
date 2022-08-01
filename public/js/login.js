//We are allowing users to login to our website by doing an HTTP request. We are doing the HTTP request to the login API endpoint using the data provided in the UI. The API then sends back a cookie which gets stored in the browser, And automatically gets sent back with each subsequent request.

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    // In order to do HTTP requests for the login, we use a very popular library called Axios. Axios also returns error if any from servers.
    // Receive the value from UI and call the API endpoint
    try {
    
    const res = await axios(
        {
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email,
                password
            }
        }
        )
        console.log(res);
        console.log(res.data.status);
        if (res.data.status === 'success') { //res.data is what we send as JSON response
            showAlert('success','Logged in successfully!');
            //To reload another page after a specific time - 1500ms
            window.setTimeout(() => {
                location.assign('/'); 
            }, 1500);
        }
        
    } catch (err) {
        showAlert('error',err.response.data.message); //From axious documentation
    }
}
/*
//Get the value from UI and pass to API
document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
})
*/

//Hit the api route
export const logOut = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout'
        });

        //if (res.data.status = 'success') location.reload(true); //Force the reload from server, not from the client
        if (res.data.status = 'success') location.assign('/'); //Force the reload from server, not from the client

    } catch (err) {
        showAlert('error', 'Error! Logging out! Try again')
    }
}