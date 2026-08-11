export class ProviderError extends Error {
  public providerCode: string;
  public statusCode: number;

  constructor(providerCode: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ProviderError';
    this.providerCode = providerCode;
    this.statusCode = statusCode;

    // Capture stack trace, excluding the constructor call from it
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProviderError);
    }
  }
}
