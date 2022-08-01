import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logOut } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//DOM Elements

const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form')
const logOutbtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const bookBtn = document.getElementById('book-tour');

//DELEGATION
if(mapBox){
const locations = JSON.parse(mapBox.dataset.locations);
//console.log(locations);
    displayMap(locations);
}

//Get the value from UI and pass to API
if(loginForm){
loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
})
}

if (logOutbtn) logOutbtn.addEventListener('click', logOut);

if (userDataForm)
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        //Multi part form data upload such as photos
        const form = new FormData();
        form.append('name', document.getElementById('name').value)
        form.append('email', document.getElementById('email').value)
        form.append('photo', document.getElementById('photo').files[0])
        console.log(form)
        //const name = document.getElementById('name').value;
        //const email = document.getElementById('email').value;
        //form will be recognized as object by axios
        //updateSettings({name, email}, 'data'); 
        updateSettings(form, 'data');
    })

if (userPasswordForm)
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent='Updating...'
        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value
        
        await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password'); //updateSettings function is an async call which returns a promise
        
        document.querySelector('.btn--save-password').textContent='Save password'
        document.getElementById('password-current').value = ''
        document.getElementById('password').value = ''
        document.getElementById('password-confirm').value=''

    })

if (bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent='processing...'
        const tourId = e.target.dataset.tourId //e is the element that was clicked. Whenever there is a -, JS converts it to camelcase
        bookTour(tourId);
    })