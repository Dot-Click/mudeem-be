import { Resend } from 'resend';
import { SendMailParams } from '../types/generalTypes';

const resend = new Resend(process.env.RESEND_API_KEY);

const SendMail = async ({
  email,
  subject,
  text
}: SendMailParams): Promise<void> => {
  const fromEmail = process.env.RESEND_SENDER_EMAIL || 'email.mudeem.ae';

  try {
    const { data, error } = await resend.emails.send({
      from: `Mudeem Sustain <${fromEmail}>`,
      to: [email],
      subject: subject,
      text: text,
    });

    if (error) {
      console.error('Email sending failed (Resend error):', error.message);
      throw error;
    }

    console.log('Email sent successfully via Resend SDK:', data?.id);
  } catch (error: any) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};

export default SendMail;
