import { NODE_ENV } from '../config.js';

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function wrapAsyncRoutes(app) {
  ['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
    const orig = app[method].bind(app);
    app[method] = (path, ...fns) =>
      orig(path, ...fns.map((fn) => (typeof fn === 'function' ? asyncHandler(fn) : fn)));
  });
}

// A 5xx message comes from an exception and may name tables, files or hosts.
// In production the caller learns the fact of the failure; the log keeps the cause.
export function sendError(res, status, message) {
  const serverFault = status >= 500;
  res.status(status).json({
    success: false,
    error: {
      code: serverFault ? 'INTERNAL_ERROR' : 'ERROR',
      message: serverFault && NODE_ENV === 'production' ? 'Internal server error' : message,
    },
  });
}

export function validationError(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = 'VALIDATION_ERROR';
  throw err;
}

export function assertPlainObject(value, label = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    validationError(`${label} must be an object`);
  }
  return value;
}

export function readString(body, field, options = {}) {
  const { required = false, defaultValue = '', max = 500 } = options;
  const value = body[field];
  if (value === undefined || value === null || value === '') {
    if (required) validationError(`${field} is required`);
    return defaultValue;
  }
  if (typeof value !== 'string') validationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) validationError(`${field} is required`);
  if (trimmed.length > max) validationError(`${field} must be ${max} characters or fewer`);
  return trimmed;
}

export function readEnum(body, field, allowed, defaultValue) {
  const value = readString(body, field, { defaultValue, max: 64 });
  if (!allowed.includes(value)) validationError(`${field} must be one of: ${allowed.join(', ')}`);
  return value;
}

export function readInt(body, field, options = {}) {
  const { defaultValue = 0, min = 0, max = Number.MAX_SAFE_INTEGER } = options;
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    validationError(`${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function readNumber(body, field, options = {}) {
  const { defaultValue = 0, min = 0, max = Number.MAX_SAFE_INTEGER } = options;
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    validationError(`${field} must be a number between ${min} and ${max}`);
  }
  return value;
}

export function readTags(body) {
  if (body.tags === undefined || body.tags === null) return [];
  if (!Array.isArray(body.tags)) validationError('tags must be an array');
  if (body.tags.length > 20) validationError('tags must contain 20 items or fewer');
  return body.tags.map((tag) => {
    if (typeof tag !== 'string') validationError('tags must be strings');
    const trimmed = tag.trim();
    if (trimmed.length > 48) validationError('tags must be 48 characters or fewer');
    return trimmed;
  }).filter(Boolean);
}

export const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function readNullableUuid(body, field) {
  const value = readString(body, field, { defaultValue: '', max: 80 });
  if (!value) return null;
  if (!isUuid(value)) {
    validationError(`${field} must be a UUID`);
  }
  return value;
}

export function readSettings(body) {
  if (body.settings === undefined || body.settings === null) return {};
  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
    validationError('settings must be an object');
  }
  return body.settings;
}

export function readEmail(body, field, options = {}) {
  const value = readString(body, field, options);
  if (!value) return value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) validationError(`${field} must be a valid email`);
  return value.toLowerCase();
}

export function getBoundedPagination(page, limit, maxLimit = 100) {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), maxLimit);
  return { page: parsedPage, offset: (parsedPage - 1) * parsedLimit, limit: parsedLimit };
}
