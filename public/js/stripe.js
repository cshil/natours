import axios from 'axios'

//Stripe object is exposed to the global scope by the script in base.pug file. npm package only works on back end

const stripe = Stripe('pk_test_51LQiPuSJsURRaEamTdos0ePwJY8ImdumFnpzWwA3EKXVdisSLcwQiYRpbkrxSoEz1PB7k5V7tN2NdVG5r8yfHQDw00khMVJ81F');

export const bookTour = async tourID => {
    try{
    //1) Get checkout session from endpoint
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourID}`) //axios returns an object
    console.log(session);

    //2) Create checkout form + charge credit card (This is a stripe API)
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    } catch (err) {
        console.log(err);
    }
}