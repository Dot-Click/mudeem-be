import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import nodemailerSendgrid from 'nodemailer-sendgrid';
import { SendMailParams } from '../types/generalTypes'; // Adjust the import path as needed

const { createTransport } = nodemailer;

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
          user: '83cabe001@smtp-brevo.com',
          pass: 'KmMhxqWg5HwUEv0B'
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
