const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

export type AccountType = 'student' | 'business';

export type AuthUser = {
  id: string;
  email: string;
  accountType: AccountType;
  isVerified: boolean;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export class AuthApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AuthApiError(data.error ?? `HTTP ${res.status}`, res.status);
  }

  return res.json() as Promise<T>;
};

export const authApi = {
  requestOtp: (email: string, accountType: AccountType) =>
    post<{ message: string }>('/auth/request-otp', { email, accountType }),

  verifyOtp: (email: string, otp: string) =>
    post<VerifyOtpResponse>('/auth/verify-otp', { email, otp }),

  refresh: (refreshToken: string) =>
    post<RefreshResponse>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string | null) =>
    post<{ message: string }>('/auth/logout', refreshToken ? { refreshToken } : {}),
};
