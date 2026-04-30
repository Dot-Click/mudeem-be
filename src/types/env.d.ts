declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_URI: string;
    PORT?: string;
    JWT_SECRET: string;
    RESEND_API_KEY: string;
    RESEND_SENDER_EMAIL?: string;
  }
}
