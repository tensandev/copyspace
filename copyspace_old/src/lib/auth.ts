import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // パスワードハッシュ化用ライブラリ
import { v4 as uuidv4 } from 'uuid'; // UUID 生成用ライブラリ
import { db } from './db'; // Prisma クライアント

const jwtSecret = process.env.JWT_SECRET_KEY;
if (!jwtSecret) {
  console.error('JWT_SECRET_KEY is not set in environment variables.');
  process.exit(1);
}
const secretKey = new TextEncoder().encode(jwtSecret); // シークレットキーをエンコード

const JWT_COOKIE_NAME = 'copyspace_token'; // Cookie 名
const JWT_EXPIRES_IN = '24h'; // JWT トークンの有効期限 (24時間)

// ユーザー登録
export async function registerUser(userId: string, passwordPlain: string) {
  const passwordHash = await bcrypt.hash(passwordPlain, 10); // パスワードをハッシュ化 (bcrypt)
  try {
    const user = await db.user.create({
      data: {
        userId: userId,
        passwordHash: passwordHash,
      },
    });
    return user;
  } catch (error) {
    logger.error('Error registering user:', error);
    throw new Error('ユーザー登録に失敗しました'); // より具体的なエラーメッセージを返すことも検討
  }
}

// ユーザー認証 (ログイン)
export async function authenticateUser(userId: string, passwordPlain: string) {
  try {
    const user = await db.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return null; // ユーザーが存在しない
    }

    const passwordMatch = await bcrypt.compare(passwordPlain, user.passwordHash); // パスワードを検証 (bcrypt)
    if (!passwordMatch) {
      logger.warn(`Invalid password for user: ${userId}`);
      return null; // パスワードが一致しない
    }

    return user; // 認証成功
  } catch (error) {
    logger.error('Error authenticating user:', error);
    return null; // 認証エラー
  }
}


// JWT トークン生成
export async function generateToken(payload: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; // 24時間後

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuer('copyspace')
    .sign(secretKey);
}

// JWT トークン検証
export async function verifyToken(token: string): Promise<{ userId: string, roomId: string | null, isAdmin: boolean } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: 'copyspace',
    });
    return { userId: payload.userId as string, roomId: payload.roomId as string | null, isAdmin: payload.isAdmin === true }; // payload から userId, roomId, isAdmin を取得
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
}

// Cookie に JWT トークンを設定
export async function setAuthCookie(token: string) {
  cookies().set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 本番環境のみ Secure 属性を付与 (HTTPS 必須)
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24時間 (秒単位)
  });
}

// Cookie を削除 (ログアウト)
export async function clearAuthCookie() {
  cookies().delete(JWT_COOKIE_NAME);
}


// Cookie から JWT トークンを取得
export async function getAuthCookie() {
  return cookies().get(JWT_COOKIE_NAME)?.value;
}

// 認証済みユーザーを取得 (API ミドルウェアで使用)
export const getAuthenticatedUser = async (req: Request): Promise<{ user: { userId: string, roomId: string | null, isAdmin: boolean } | null, errorResponse: NextResponse | null }> => {
  const token = await getAuthCookie();
  if (!token) {
    return { user: null, errorResponse: NextResponse.json({ error: '認証が必要です', status: 401 }) }; // 401 Unauthorized
  }

  const verifiedToken = await verifyToken(token);
  if (!verifiedToken) {
    return { user: null, errorResponse: NextResponse.json({ error: '認証に失敗しました', status: 401 }) }; // 401 Unauthorized
  }

  return { user: verifiedToken, errorResponse: null }; // 認証成功
};


// ルーム参加認証 (API ミドルウェアで使用)
export const isAuthenticatedRoomParticipant = async (req: Request, roomId: string): Promise<{ user: { userId: string, roomId: string | null, isAdmin: boolean } | null, errorResponse: NextResponse | null }> => {
  const authResult = await getAuthenticatedUser(req);
  if (authResult.errorResponse) {
    return authResult; // 認証エラーをそのまま返す
  }
  if (!authResult.user || authResult.user.roomId !== roomId) {
    return { user: null, errorResponse: NextResponse.json({ error: 'ルームへの参加が必要です', status: 403 }) }; // 403 Forbidden
  }
  return { user: authResult.user, errorResponse: null }; // ルーム参加認証成功
};


// 管理者権限チェック (API ミドルウェアで使用)
export const isAdminRoomParticipant = async (req: Request, roomId: string): Promise<{ user: { userId: string, roomId: string | null, isAdmin: boolean } | null, errorResponse: NextResponse | null }> => {
  const authResult = await isAuthenticatedRoomParticipant(req, roomId);
  if (authResult.errorResponse) {
    return authResult; // 認証・ルーム参加エラーをそのまま返す
  }
  if (!authResult.user?.isAdmin) {
    return { user: null, errorResponse: NextResponse.json({ error: '管理者権限が必要です', status: 403 }) }; // 403 Forbidden
  }
  return { user: authResult.user, errorResponse: null }; // 管理者権限あり
};


// 招待状検証 (API ミドルウェアで使用)
export const verifyInvitationCode = async (invitationCode: string): Promise<{ invitation: any | null, errorResponse: NextResponse | null }> => {
  if (!invitationCode) {
    return { invitation: null, errorResponse: NextResponse.json({ error: '招待コードが必要です', status: 400 }) }; // 400 Bad Request
  }

  try {
    const invitation = await db.invitation.findUnique({
      where: { code: invitationCode },
      include: { room: true } // ルーム情報も取得
    });

    if (!invitation) {
      return { invitation: null, errorResponse: NextResponse.json({ error: '招待コードが無効です', status: 404 }) }; // 404 Not Found
    }

    if (invitation.expiresAt < new Date()) {
      return { invitation: null, errorResponse: NextResponse.json({ error: '招待コードの有効期限切れです', status: 410 }) }; // 410 Gone (期限切れ)
    }

    return { invitation: invitation, errorResponse: null }; // 招待状検証成功

  } catch (error) {
    logger.error('Error verifying invitation code:', error);
    return { invitation: null, errorResponse: NextResponse.json({ error: '招待コードの検証に失敗しました', status: 500 }) }; // 500 Internal Server Error
  }
};