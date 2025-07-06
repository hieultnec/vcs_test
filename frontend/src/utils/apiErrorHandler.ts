export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

interface AxiosErrorResponse {
  status: number;
  data?: {
    message?: string;
  };
}

interface AxiosError {
  response?: AxiosErrorResponse;
  request?: unknown;
  message?: string;
}

export class ApiErrorHandler {
  static handleError(error: AxiosError | Error | unknown): ApiError {
    // Handle axios errors
    if (error && typeof error === 'object' && 'response' in error && error.response) {
      const axiosError = error as AxiosError;
      const { status, data } = axiosError.response;
      
      // Handle different HTTP status codes
      switch (status) {
        case 400:
          return {
            status,
            message: 'Bad Request',
            details: data?.message || 'Invalid request data'
          };
        case 401:
          return {
            status,
            message: 'Unauthorized',
            details: 'Please log in to continue'
          };
        case 403:
          return {
            status,
            message: 'Forbidden',
            details: 'You do not have permission to perform this action'
          };
        case 404:
          return {
            status,
            message: 'Not Found',
            details: data?.message || 'The requested resource was not found'
          };
        case 409:
          return {
            status,
            message: 'Conflict',
            details: data?.message || 'Resource conflict occurred'
          };
        case 422:
          return {
            status,
            message: 'Validation Error',
            details: data?.message || 'Invalid data provided'
          };
        case 500:
          return {
            status,
            message: 'Server Error',
            details: 'An internal server error occurred. Please try again later.'
          };
        case 502:
          return {
            status,
            message: 'Bad Gateway',
            details: 'Service temporarily unavailable'
          };
        case 503:
          return {
            status,
            message: 'Service Unavailable',
            details: 'Service is temporarily unavailable. Please try again later.'
          };
        default:
          return {
            status,
            message: 'Request Failed',
            details: data?.message || 'An unexpected error occurred'
          };
      }
    }
    
    // Handle network errors
    if (error && typeof error === 'object' && 'request' in error && error.request) {
      return {
        status: 0,
        message: 'Network Error',
        details: 'Unable to connect to the server. Please check your internet connection.'
      };
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return {
      status: 0,
      message: 'Unknown Error',
      details: errorMessage
    };
  }

  static getErrorMessage(error: ApiError): string {
    if (error.details) {
      return `${error.message}: ${error.details}`;
    }
    return error.message;
  }

  static isRetryable(error: ApiError): boolean {
    // Retry on network errors, 5xx server errors, and some 4xx errors
    return error.status === 0 || 
           (error.status >= 500 && error.status < 600) ||
           error.status === 408 || // Request Timeout
           error.status === 429;   // Too Many Requests
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt - 1), 16000);
  }
}

export const createApiError = (status: number, message: string, details?: string): ApiError => ({
  status,
  message,
  details
});

export const isApiError = (error: unknown): error is ApiError => {
  return error && typeof error === 'object' && 'status' in error && 'message' in error;
}; 