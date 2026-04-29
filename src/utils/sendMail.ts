import nodemailer from 'nodemailer';
import { SendMailParams } from '../types/generalTypes';

const SendMail = async ({
  email,
  subject,
  text
}: SendMailParams): Promise<void> => {
  const fromEmail = process.env.BREVO_SENDER_EMAIL || '';

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER || '',
      pass: process.env.BREVO_SMTP_PASS || '',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Mudeem Sustain" <${fromEmail}>`,
      to: email,
      subject: subject,
      text: text,
    });

    console.log('Email sent successfully via SMTP:', info.messageId);
  } catch (error: any) {
    console.error('Email sending failed (SMTP error):', error.message);
    throw error;
  }
};

export default SendMail;
