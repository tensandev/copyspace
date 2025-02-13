import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRoomId } from '@/lib/utils';
import { getAuthenticatedUser } from '@/lib/auth'; // 認証済みユーザー取得関数をインポート
import { withAuthentication } from '@/lib/middleware'; // 認証チェックミドルウェアをインポート
import { logger } from '@/lib/logger'; // logger をインポート

// スペース作成 (POST /api/rooms) - 認証が必要
export const POST = withAuthentication(async function POST(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) { // エンドポイントを /api/rooms に変更
  try {
    const reqBody = await request.json();
    const { isPublic } = reqBody; // 公開/招待制設定をリクエストボディから取得

    const roomId = generateRoomId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // デフォルト有効期限: 24時間後

    const room = await db.room.create({
      data: {
        roomId: roomId,
        createdAt: now,
        updatedAt: now,
        expiresAt: expiresAt,
        isPublic: isPublic === true,
        adminUser: user.userId, // 認証済みユーザーを管理者として設定
      },
    });

    // ルーム作成者を RoomParticipant に追加
    await db.roomParticipant.create({
      data: {
        roomId: roomId,
        userId: user.userId,
        joinedAt: now,
      },
    });


    logger.info(`Room ${roomId} created by user ${user.userId}, public: ${isPublic}`);
    return NextResponse.json({ roomId: roomId, message: 'スペースを作成しました' }, { status: 201 }); // 201 Created

  } catch (error: any) {
    logger.error('Error creating room:', error);
    return NextResponse.json({ error: 'スペースの作成に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});