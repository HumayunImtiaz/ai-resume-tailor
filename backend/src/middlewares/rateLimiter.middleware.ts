import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      statusCode: 429,
      status: 'error',
      data: null,
      message: 'Too many attempts, please try again later.',
    });
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  handler: (req, res) => {
    res.status(429).json({
      statusCode: 429,
      status: 'error',
      data: null,
      message: 'Too many attempts, please try again later.',
    });
  },
});
