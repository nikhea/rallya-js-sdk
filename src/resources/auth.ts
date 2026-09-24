import { RallyaClient } from "../client.js";
import type { TokenPair } from "../client.js";
import type { LoginInput, Me, OrgMembership, Page, PageQuery, RegisterInput } from "../types.js";

export class AuthResource {
  constructor(private readonly client: RallyaClient) {}

  register(input: RegisterInput): Promise<TokenPair> {
    return this.client.request<TokenPair>("auth/register", { method: "POST", body: input, auth: false });
  }

  login(input: LoginInput): Promise<TokenPair> {
    return this.client.request<TokenPair>("auth/login", { method: "POST", body: input, auth: false });
  }

  refresh(refreshToken: string): Promise<TokenPair> {
    return this.client.request<TokenPair>("auth/refresh", {
      method: "POST",
      body: { refreshToken },
      auth: false,
      retryAuth: false,
    });
  }

  verifyEmail(token: string): Promise<{ message: string }> {
    return this.client.request("auth/verify-email", { method: "POST", body: { token }, auth: false });
  }

  verifyEmailLink(token: string): Promise<{ message: string }> {
    return this.client.request("auth/verify-email", { method: "GET", query: { token }, auth: false });
  }

  verifyCode(email: string, code: string): Promise<{ message: string }> {
    return this.client.request("auth/verify-code", { method: "POST", body: { email, code }, auth: false });
  }

  resendVerification(email: string): Promise<{ message: string }> {
    return this.client.request("auth/resend-verification", { method: "POST", body: { email }, auth: false });
  }

  forgotPassword(email: string): Promise<{ message: string }> {
    // Always 200 (no account enumeration).
    return this.client.request("auth/forgot-password", { method: "POST", body: { email }, auth: false });
  }

  resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.client.request("auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
      auth: false,
    });
  }

  logout(): Promise<{ message: string }> {
    return this.client.request("auth/logout", { method: "POST" });
  }

  me(): Promise<Me> {
    return this.client.request<Me>("auth/me", { method: "GET" });
  }
}

export type { LoginInput, Me, OrgMembership, Page, PageQuery, RegisterInput, TokenPair };
