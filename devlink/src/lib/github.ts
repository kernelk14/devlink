export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Iv23liAqm1Wj3CWPj7QX';

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
}

export interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function startGithubAuth(onUrl: (url: string) => void): Promise<string> {
  const response = await fetch('/github/device-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: 'user:email read:user' }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  onUrl(data.user_code || '');
  return data.device_code;
}

export async function pollGithubToken(deviceCode: string, interval: number = 5000): Promise<string> {
  const response = await fetch('/github/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_code: deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }),
  });

  const data = await response.json();

  if (data.access_token) {
    return data.access_token;
  }

  if (data.error === 'authorization_pending') {
    return 'pending';
  }

  if (data.error === 'slow_down') {
    return 'slow_down';
  }

  throw new Error(data.error_description || data.error);
}

export async function getGithubUser(token: string): Promise<GithubUser> {
  const response = await fetch(`/github/user?token=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export async function getGithubEmails(token: string): Promise<GithubEmail[]> {
  try {
    const response = await fetch(`/github/emails?token=${encodeURIComponent(token)}`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export function buildGithubUsername(name: string | null, login: string): string {
  return login.toLowerCase().replace(/[^a-z0-9_]/g, '');
}