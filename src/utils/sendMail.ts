import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import nodemailerSendgrid from 'nodemailer-sendgrid';
import { SendMailParams } from '../types/generalTypes'; // Adjust the import path as needed

const { createTransport } = nodemailer;
//SMTP KEY: xsmtpsib-a38db9dbef9c2be0535e8f06f5e39fe74fa9ac6a97d14e4cc9a48efb700ccf63-bznu6VBFglcMbn8T
const SendMail = async ({
  email,
  subject,
  text
}: SendMailParams): Promise<void> => {
  try {
    const transport: Transporter = createTransport(
      // nodemailerSendgrid({
      //   apiKey: process.env.NODEMAILER_API_KEY as string
      // })
      // smtp transport
      {
        host: 'smtp-relay.brevo.com',
        port: 587,
        // secure: false,
        auth: {
          user: 'a92c24001@smtp-brevo.com',
          pass: 'xsmtpsib-a38db9dbef9c2be0535e8f06f5e39fe74fa9ac6a97d14e4cc9a48efb700ccf63-bznu6VBFglcMbn8T'
        }
      }
    );

    const mailOptions: SendMailOptions = {
      from: 'mudeemsustainapp@gmail.com',
      to: email,
      subject,
      text
    };

    await transport.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

export default SendMail;
