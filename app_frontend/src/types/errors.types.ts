export enum DomainErrorCodeEnum {
  EMAIL_TAKEN = "EMAIL_TAKEN",
  USERNAME_TAKEN = "USERNAME_TAKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

export interface FieldErrorsShape {
  [key: string]: string[] | undefined,
}

export interface HttpLikeErrorShape {
  response?: {
    status?: number,
    data?: unknown,
  },
}

export interface ApiPayloadShape {
  code?: string,
  error_code?: string,
  errorCode?: string,
  message?: string,
  error_message?: string,
  fields?: string[],
  errors?: FieldErrorsShape,
  error?: ApiPayloadShape,
  [key: string]: unknown,
}
