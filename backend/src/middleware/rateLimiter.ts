import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes.',
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: {
    success: false,
    error: 'AI request limit reached. Please wait before making more AI requests.',
  },
});
