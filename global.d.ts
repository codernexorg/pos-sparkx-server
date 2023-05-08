namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;
    JWT_SECRET: string;
    DB_NAME: string;
    DB_HOST: string;
    DB_USER: string;
    DB_PORT: string;
    DB_PASS: string;
    DB: string;
  }
}
