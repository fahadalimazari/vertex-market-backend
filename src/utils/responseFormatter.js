/**
 * Standardize API responses across the enterprise application.
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Message for the response
 * @param {Object|Array} data - Data payload
 * @param {Object} pagination - Pagination metadata (page, limit, total)
 * @param {Object} meta - Additional metadata
 */
export const sendResponse = (res, statusCode, message, data = {}, pagination = null, meta = {}) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};
