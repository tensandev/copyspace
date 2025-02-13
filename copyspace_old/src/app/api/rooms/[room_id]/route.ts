import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminRoomAuthorization } from '@/lib/middleware'; // 管理者権限チェックミドルウェアをインポート
import { logger } from '@/lib/logger'; // logger をインポート

// スペース削除 (DELETE /api/rooms/{room_id}) - 管理者権限が必要
export const DELETE = withAdminRoomAuthorization(async function DELETE(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const roomId = params.room_id;

  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId }
    });

    if (!room) {
      logger.warn(`Room ${roomId} not found for deletion`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 }); // 404 Not Found
    }

    if (room.adminUser !== user.userId) { // 管理者ユーザーID を比較
      logger.warn(`User ${user.userId} is not admin of room ${roomId}`);
      return NextResponse.json({ error: '管理者権限が必要です', status: 403 }); // 403 Forbidden
    }


    await db.room.delete({
      where: { roomId: roomId },
    });
    // Prisma cascade delete 設定により、関連するメッセージと参加者も自動削除される


    logger.info(`Room ${roomId} deleted by admin user ${user.userId}`);
    return NextResponse.json({ message: 'スペースを削除しました' }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error deleting room:', error);
    return NextResponse.json({ error: 'スペースの削除に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});