import axios from 'axios';
import { SendMailParams } from '../types/generalTypes';

const SendMail = async ({
  email,
  subject,
  text
}: SendMailParams): Promise<void> => {
  const apiKey = process.env.NODEMAILER_API_KEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL || 'mudeemsustainapp@gmail.com';

  if (!apiKey) {
    console.error('Email error: NODEMAILER_API_KEY is not defined');
    throw new Error('Email configuration missing');
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: fromEmail, name: 'Mudeem Sustain' },
        to: [{ email: email }],
        subject: subject,
        textContent: text
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Email sent successfully via API:', response.data.messageId);
  } catch (error: any) {
    if (error.response) {
      console.error('Brevo API error:', error.response.data);
      // provide a clearer error message for activation issues
      const errorMessage = error.response.data.message || '';
      if (error.response.data.code === 'unauthorized' || errorMessage.includes('activated')) {
        throw new Error('Brevo SMTP/API account is not activated. Please check your Brevo dashboard or contact support.');
      }
      throw new Error(errorMessage || 'Failed to send email via Brevo API');
    }
    console.error('Email sending failed (Network/Timeout):', error.message);
    throw error;
  }
};

export default SendMail;
