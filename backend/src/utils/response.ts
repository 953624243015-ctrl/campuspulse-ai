import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = { success: true, data, message, meta };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  message?: string
): Response => {
  const response: ApiResponse = { success: false, error, message };
  return res.status(statusCode).json(response);
};

export const sendNotFound = (res: Response, resource = 'Resource'): Response =>
  sendError(res, `${resource} not found`, 404);

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): Response =>
  sendError(res, message, 401);

export const sendForbidden = (res: Response, message = 'Access denied'): Response =>
  sendError(res, message, 403);

export const sendValidationError = (res: Response, errors: unknown): Response =>
  res.status(422).json({ success: false, error: 'Validation failed', details: errors });

export const getPagination = (
  page: unknown = 1,
  limit: unknown = 20
): { page: number; limit: number; offset: number } => {
  const p = Math.max(1, parseInt(String(page), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
  return { page: p, limit: l, offset: (p - 1) * l };
};

export const buildMeta = (
  page: number,
  limit: number,
  total: number
): ApiResponse['meta'] => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
