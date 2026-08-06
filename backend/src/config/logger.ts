import winston from 'winston';
import { env } from './env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  errors({ stack: true }),
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const prodFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json()
);

const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: env.nodeEnv === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

export default logger;
