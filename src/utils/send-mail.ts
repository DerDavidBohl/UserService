import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";


const env = process.env;

  export const mailer = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT as unknown as number || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.MAIL_ADDRESS, // generated ethereal user
      pass: env.MAIL_PASSWORD // generated ethereal password
    }
  });

  export const fromEmail = `"${process.env.MAIL_DISPLAY_NAME}" <${process.env.MAIL_ADDRESS}>`;