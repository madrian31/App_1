export type FormStatus = "idle" | "loading" | "success" | "error";

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}