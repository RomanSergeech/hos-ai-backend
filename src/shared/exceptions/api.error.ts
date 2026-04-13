
export class ApiError extends Error {
  status: number
  errors: unknown[]

  constructor(status: number, message: string, errors: unknown[] = []) {
    super(message)
    this.status = status
    this.errors = errors
  }

  static BadRequest(message: string, errors: unknown[] = []) {
    return new ApiError(400, message, errors)
  }

  static UnauthorizedError(message: string, errors: unknown[] = []) {
    return new ApiError(401, message, errors)
  }

  static Forbidden(message: string, errors: unknown[] = []) {
    return new ApiError(403, message, errors)
  }

  static NotFound(message: string, errors: unknown[] = []) {
    return new ApiError(404, message, errors)
  }
}
