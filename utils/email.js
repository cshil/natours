const nodemailer = require('nodemailer'); //To send emails out
const pug = require('pug');
const htmlToText = require('html-to-text');


//new Email(user, url).sendWelcome();

module.exports = class Email{
    constructor(user, url) {
        //Each object created from this call will get this property
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Shilpa <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        //sendgrid
        //return 1;
        //Sendgrid service is predefined in nodemailer for sending emails to real email addresses. Create account in sendgrid, select SMTP relay and create API key, copy those to config
        return nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USERNAME,
                pass: process.env.SENDGRID_PASSWORD

            }
        })

        /*For mailtrap - sending emails to fake email addresses for development purpose
        return nodemailer.createTransport({
            //service: 'GMAIL',
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            }
        })
        */
    }

    async send(template, subject) {
        //Send the actual email

        //1) Render HTML based on PUG template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
            
        }) //This will take in a file and render pug code in real HTML. dirname is the location of the currently running script which is utils folder. And go one level up. Data can be passed to the pug file such as firstName for email personalization


        //2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.fromString(html), //Convert html to text
            //html:
        }

        //3) Create a transport and send email

        
        await this.newTransport().sendMail(mailOptions); 
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the natours family!')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token!')
    }
}


/*
//nodemailer is used for testing purposes which is a npm package
const sendEmail = async options => {
    
    //1) Create a transporter

    const transporter = nodemailer.createTransport({
        //service: 'GMAIL',
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        }
        //Activate in gmail "less secure app" option
    })



    //2) Define the email options
    const mailOptions = {
        from: 'Shilpa <hello@jonas.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        //html:
    }
       

    //3) Actually send the email
    await transporter.sendMail(mailOptions); //This returns a promise
}

module.exports = sendEmail;
 */