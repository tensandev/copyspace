import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { withAdminRoomAuthorization } from '@/lib/middleware'; // 管理者権限チェックミドルウェアをインポート
import { logger } from '@/lib/logger'; // logger をインポート

// JSON エクスポート (GET /api/export/{room_id}) - 管理者権限が必要
export const GET = withAdminRoomAuthorization(async function GET(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const roomId = params.room_id;

  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId },
      include: { messages: true } // メッセージを eager load
    });

    if (!room) {
      logger.warn(`Room ${roomId} not found for export`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 });
    }

    if (room.expiresAt < new Date()) {
      return NextResponse.json({ error: 'ルームの有効期限が切れました', status: 410 });
    }

    const exportData = {
      room_id: room.roomId,
      created_at: room.createdAt,
      updated_at: room.updatedAt,
      is_public: room.isPublic,
      messages: room.messages.map(msg => ({
        user: msg.user,
        text: decrypt(msg.messageText), // 復号化
        timestamp: msg.createdAt,
      })).filter(msg => msg.text !== null) // 復号化失敗メッセージフィルタリング
    };

    logger.info(`JSON exported for room ${roomId} by user ${user.userId}`);
    return NextResponse.json(exportData, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error exporting JSON:', error);
    return NextResponse.json({ error: 'JSONエクスポートに失敗しました', status: 500 }); // 500 Internal Server Error
  }
});