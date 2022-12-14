import axios from 'axios';
import { showAlert } from './alerts';

//update data. Get the value from index.js
//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    //Use axios to create the API call
    try {

        const url = type ==='password' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe'

        const res=await axios({
            method: 'PATCH',
            url,
            data
        });

        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully`)
    }
        
    } catch (err) {
        showAlert('error', err.response.data.message); //Message property is defined on the server whenever there is an error
    }

}