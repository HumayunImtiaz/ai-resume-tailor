import env from './env';

let connectionOptions: any = {
  host: env.redis.host,
  port: env.redis.port,
};

if (env.redis.url) {
  const url = new URL(env.redis.url);
  connectionOptions = {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

export const redisConnection = connectionOptions;
