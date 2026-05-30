import axios, { AxiosError } from "axios";
import { tokenStorage } from "../utils/token";

interface ApiValidationError {
  field?: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  details?: {
    errors?: ApiValidationError[];
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
}

export class ApiClientError extends Error {
  status?: number;
  responseData?: ApiErrorResponse;
  validationMessages: string[];

  constructor(message: string, options: {
    status?: number;
    responseData?: ApiErrorResponse;
    validationMessages?: string[];
  } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.responseData = options.responseData;
    this.validationMessages = options.validationMessages ?? [];
  }
}

const getValidationMessagesFromResponse = (data?: ApiErrorResponse): string[] => {
  const explicitErrors = data?.details?.errors?.map((error) =>
    error.field ? `${error.field}: ${error.message}` : error.message
  );

  if (explicitErrors?.length) {
    return explicitErrors;
  }

  const fieldErrors = data?.details?.fieldErrors
    ? Object.entries(data.details.fieldErrors).flatMap(([field, messages]) =>
        messages.map((message) => `${field}: ${message}`)
      )
    : [];
  const formErrors = data?.details?.formErrors ?? [];

  return [...fieldErrors, ...formErrors];
};

export const getApiErrorMessages = (error: unknown, fallback: string): string[] => {
  if (error instanceof ApiClientError && error.validationMessages.length) {
    return error.validationMessages;
  }

  if (error instanceof Error && error.message) {
    return [error.message];
  }

  return [fallback];
};

export const hasApiValidationMessages = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError && error.validationMessages.length > 0;

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalApiBaseUrl =
  configuredApiBaseUrl?.includes("localhost") || configuredApiBaseUrl?.includes("127.0.0.1");
const apiBaseUrl =
  configuredApiBaseUrl && !(import.meta.env.PROD && isLocalApiBaseUrl)
    ? configuredApiBaseUrl
    : import.meta.env.DEV
      ? "http://localhost:5000"
      : undefined;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  if (!apiBaseUrl) {
    throw new ApiClientError(
      "Missing production API URL. Set VITE_API_BASE_URL to the deployed backend URL in the frontend Vercel project."
    );
  }

  const token = tokenStorage.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const validationMessages = getValidationMessagesFromResponse(error.response?.data);
    const message =
      validationMessages.length > 0
        ? validationMessages.join("\n")
        : error.response?.data?.message ||
          error.message ||
          "Something went wrong while communicating with the API";

    if (error.response?.status === 401) {
      tokenStorage.clear();
    }

    return Promise.reject(
      new ApiClientError(message, {
        status: error.response?.status,
        responseData: error.response?.data,
        validationMessages
      })
    );
  }
);
