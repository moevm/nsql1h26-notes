import { AxiosError } from "axios";

export function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { detail?: string; message?: string } | undefined;
    return data?.detail || data?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
