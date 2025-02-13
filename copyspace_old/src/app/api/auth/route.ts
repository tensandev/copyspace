import { NextResponse } from 'next/server';
import { generateToken, setAuthCookie, authenticateUser, registerUser } from '@/lib/auth';
import { logger } from '@/lib/logger'; // logger をインポート

// ログイン (POST /api/auth/login)
export async function POST(request: Request) {
  try {
    const reqBody = await request.json();
    const { userId, password } = reqBody;

    if (!userId || !password) {
      logger.warn('Login request missing userId or password');
      return NextResponse.json({ error: 'ユーザーIDとパスワードを入力してください', status: 400 }); // 400 Bad Request
    }

    const user = await authenticateUser(userId, password); // ユーザー認証

    if (!user) {
      logger.warn(`Authentication failed for user: ${userId}`);
      return NextResponse.json({ error: '認証に失敗しました', status: 401 }); // 401 Unauthorized
    }

    const tokenPayload = { userId: user.userId, roomId: null, isAdmin: false }; // ルームID はログイン時は null
    const token = await generateToken(tokenPayload); // JWT トークン生成
    await setAuthCookie(token); // Cookie に JWT トークン設定

    logger.info(`User ${userId} logged in successfully`);
    return NextResponse.json({ message: 'ログインに成功しました', userId: user.userId }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Login error:', error);
    return NextResponse.json({ error: 'ログイン処理中にエラーが発生しました', status: 500 }); // 500 Internal Server Error
  }
}


// ユーザー登録 (POST /api/auth/register) -  開発環境でのみ有効 (本番環境では登録フローを別途検討)
export async function PUT(request: Request) { // PUT リクエストでユーザー登録
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'ユーザー登録APIは本番環境では無効です', status: 403 }); // 本番環境では登録 API を無効化 (403 Forbidden)
  }

  try {
    const reqBody = await request.json();
    const { userId, password } = reqBody;

    if (!userId || !password) {
      logger.warn('Registration request missing userId or password');
      return NextResponse.json({ error: 'ユーザーIDとパスワードを入力してください', status: 400 }); // 400 Bad Request
    }

    const existingUser = await db.user.findUnique({ where: { userId: userId } });
    if (existingUser) {
      logger.warn(`User ID already exists: ${userId}`);
      return NextResponse.json({ error: 'ユーザーIDは既に登録されています', status: 409 }); // 409 Conflict
    }


    const user = await registerUser(userId, password); // ユーザー登録

    logger.info(`User ${userId} registered successfully`);
    return NextResponse.json({ message: 'ユーザー登録に成功しました', userId: user.userId }, { status: 201 }); // 201 Created

  } catch (error: any) {
    logger.error('Registration error:', error);
    return NextResponse.json({ error: 'ユーザー登録処理中にエラーが発生しました', status: 500 }); // 500 Internal Server Error
  }
}


// ログアウト (DELETE /api/auth/logout)
export async function DELETE(request: Request) {
  try {
    await clearAuthCookie(); // Cookie を削除
    logger.info('User logged out successfully');
    return NextResponse.json({ message: 'ログアウトしました', status: 200 }); // 200 OK
  } catch (error: any) {
    logger.error('Logout error:', error);
    return NextResponse.json({ error: 'ログアウト処理中にエラーが発生しました', status: 500 }); // 500 Internal Server Error
  }
}