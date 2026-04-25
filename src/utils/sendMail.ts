import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { SendMailParams } from '../types/generalTypes';

const SendMail = async ({
  email,
  subject,
  text
}: SendMailParams): Promise<void> => {
  const host = process.env.BREVO_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_PORT || '587');
  const user = process.env.BREVO_USER || 'a92c24001@smtp-brevo.com';
  const pass = process.env.Brevo_SMTPKEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL || 'mudeemsustainapp@gmail.com';

  if (!pass) {
    console.error('Email error: NODEMAILER_API_KEY is not defined');
    throw new Error('Email configuration missing');
  }

  try {
    const transport: Transporter = nodemailer.createTransport({
      host,
      port,
      auth: {
        user,
        pass
      }
    });

    const mailOptions: SendMailOptions = {
      from: fromEmail,
      to: email,
      subject,
      text
    };

    const info = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export default SendMail;
