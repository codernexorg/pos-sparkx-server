import dotenv from 'dotenv';
import path from 'path';

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  NODE_ENV: string | undefined;
  PORT: number | undefined;
  JWT_SECRET: string | undefined;
  DB_NAME: string | undefined;
  DB_HOST: string | undefined;
  DB_USER: string | undefined;
  DB_PORT: number | undefined;
  DB_PASS: string | undefined;
  DB: string | undefined;
}

interface Config {
  NODE_ENV: 'development' | 'production';
  PORT: number;
  JWT_SECRET: string;
  DB_NAME: string;
  DB_HOST: string;
  DB_USER: string;
  DB_PORT: number;
  DB_PASS: string;
  DB: string;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
    JWT_SECRET: process.env.JWT_SECRET,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    DB_PASS: process.env.DB_PASS,
    DB_USER: process.env.DB_USER,
    DB: process.env.DB
  };
};

// Throwing an Error if any field was undefined we don't
// want our app to run if it can't connect to DB and ensure
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type
// definition.

const getSanitizedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;
