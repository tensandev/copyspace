import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminRoomAuthorization } from '@/lib/middleware'; // 管理者権限チェックミドルウェアをインポート
import { logger } from '@/lib/logger'; // logger をインポート

// 有効期限延長 (POST /api/rooms/{room_id}/extend-expiry) - 管理者権限が必要
export const POST = withAdminRoomAuthorization(async function POST(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const roomId = params.room_id;
  const reqBody = await request.json();
  const { extendDays } = reqBody; // 延長日数をリクエストボディから取得

  if (!extendDays || ![2, 5, 7].includes(extendDays)) { // 2日, 5日, 7日以外はエラー
    logger.warn(`Invalid extend days value ${extendDays} for room ${roomId}`);
    return NextResponse.json({ error: '無効な延長日数です', status: 400 }); // 400 Bad Request
  }

  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId }
    });
    if (!room) {
      logger.warn(`Room ${roomId} not found for expiry extension`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 }); // 404 Not Found
    }
    if (room.adminUser !== user.userId) { // 管理者ユーザーID を比較
      logger.warn(`User ${user.userId} is not admin of room ${roomId} for expiry extension`);
      return NextResponse.json({ error: '管理者権限が必要です', status: 403 }); // 403 Forbidden
    }


    const extendHours = extendDays * 24;
    const updatedRoom = await db.room.update({
      where: { roomId: roomId },
      data: {
        expiresAt: {
          set: new Date(room.expiresAt.getTime() + extendHours * 60 * 60 * 1000) // 現在の有効期限から延長
        },
      },
    });

    logger.info(`Room ${roomId} expiry extended by ${extendDays} days by admin user ${user.userId}`);
    return NextResponse.json({ message: `有効期限を${extendDays}日延長しました`, expiresAt: updatedRoom.expiresAt }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error extending room expiry:', error);
    return NextResponse.json({ error: '有効期限の延長に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});