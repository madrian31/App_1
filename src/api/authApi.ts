import type { LoginCredentials } from "../types/auth";

export async function loginRequest(credentials: LoginCredentials): Promise<{ token: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credentials.password === "password123") {
        resolve({ token: "mock-token-123" });
      } else {
        reject(new Error("Invalid credentials"));
      }
    }, 1200);
  });
  
}