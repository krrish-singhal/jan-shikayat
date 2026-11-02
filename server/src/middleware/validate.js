import { sendError } from '../utils/response.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: details[0]?.message || 'Invalid request payload',
            details,
          },
          400
        );
      }
      return sendError(res, { code: 'VALIDATION_ERROR', message: err.message }, 400);
    }
  };
}
