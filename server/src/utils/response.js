export function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated(res, { items = [], page = 1, limit = 10, total = 0 }, statusCode = 200) {
  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  return res.status(statusCode).json({
    success: true,
    data: {
      items,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
    },
  });
}

export function sendError(res, { code = 'ERROR', message = 'An error occurred', details = [] }, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
