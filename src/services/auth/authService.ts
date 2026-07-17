import { loginRequest } from "../../api/authApi";
import type { LoginCredentials } from "../../types/auth";

export async function loginUser(credentials: LoginCredentials): Promise<{ token: string }> {
  const result = await loginRequest(credentials);


  return result;
}