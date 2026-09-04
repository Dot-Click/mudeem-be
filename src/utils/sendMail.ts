import { Resend } from 'resend';
import { SendMailParams } from '../types/generalTypes';
import logger from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const SendMail = async ({
  email,
  subject,
  text,
  html
}: SendMailParams): Promise<void> => {
  let fromEmail = process.env.RESEND_SENDER_EMAIL || 'no-reply@email.mudeem.ae';
  if (!fromEmail.includes('@')) {
    fromEmail = `no-reply@${fromEmail}`;
  }

  if (!process.env.RESEND_API_KEY) {
    logger.error({
      event: 'mail.misconfigured',
      message: 'RESEND_API_KEY is not set; no email can be sent',
      to: email,
      subject
    });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: subject,
      text: text,
      ...(html ? { html } : {})
    });

    if (error) {
      // Resend accepted the request but refused the send (unverified domain,
      // quota, blocked recipient). Log the recipient so it can be traced in
      // the Resend dashboard.
      logger.error({
        event: 'mail.rejected',
        to: email,
        from: fromEmail,
        subject,
        name: error.name,
        message: error.message
      });
      throw error;
    }

    logger.info({ event: 'mail.sent', to: email, subject, id: data?.id });
  } catch (error) {
    logger.error({
      event: 'mail.failed',
      to: email,
      from: fromEmail,
      subject,
      message: (error as Error).message
    });
    throw error;
  }
};

export default SendMail;
