// @ts-nocheck
/**
 * Standardized API Response Wrapper
 * Ensures all API responses follow a consistent format.
 */

class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Response payload
   * @param {string} message - Human-readable message
   */
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  // ── Factory Methods ──────────────────────────────────
  static ok(data, message = 'Success') {
    return new ApiResponse(200, data, message);
  }

  static created(data, message = 'Created successfully') {
    return new ApiResponse(201, data, message);
  }

  static noContent(message = 'Deleted successfully') {
    return new ApiResponse(204, null, message);
  }

  /**
   * Send response via Express res object
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

export default ApiResponse;

