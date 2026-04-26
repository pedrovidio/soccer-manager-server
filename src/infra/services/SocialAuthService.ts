import { OAuth2Client } from 'google-auth-library';

export interface SocialProfile {
  providerId: string;
  email: string;
  name: string;
  provider: 'google' | 'facebook';
}

const googleClient = new OAuth2Client();

export class SocialAuthService {
  async verifyGoogle(idToken: string): Promise<SocialProfile> {
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured');

    const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error('Invalid Google token payload');

    return {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
    };
  }

  async verifyFacebook(accessToken: string): Promise<SocialProfile> {
    const appId = process.env['FACEBOOK_APP_ID'];
    const appSecret = process.env['FACEBOOK_APP_SECRET'];
    if (!appId || !appSecret) throw new Error('FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is not configured');

    const appTokenRes = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`,
    );
    const { access_token: appToken } = await appTokenRes.json() as { access_token: string };

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appToken}`,
    );
    const { data } = await debugRes.json() as { data: { is_valid: boolean; user_id: string } };
    if (!data.is_valid) throw new Error('Invalid Facebook token');

    const profileRes = await fetch(
      `https://graph.facebook.com/${data.user_id}?fields=name,email&access_token=${accessToken}`,
    );
    const profile = await profileRes.json() as { id: string; name: string; email?: string };

    return {
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email ?? `${profile.id}@facebook.com`,
      name: profile.name,
    };
  }
}
