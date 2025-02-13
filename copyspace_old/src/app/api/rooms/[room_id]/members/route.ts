import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminRoomAuthorization } from '@/lib/middleware'; // 管理者権限チェックミドルウェアをインポート
import { logger } from '@/lib/logger'; // logger をインポート

// 参加者リスト取得 (GET /api/rooms/{room_id}/members) - 管理者権限が必要
export const GET = withAdminRoomAuthorization(async function GET(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const roomId = params.room_id;

  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId }
    });
    if (!room) {
      logger.warn(`Room ${roomId} not found for member list`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 }); // 404 Not Found
    }
    if (room.adminUser !== user.userId) { // 管理者ユーザーID を比較
      logger.warn(`User ${user.userId} is not admin of room ${roomId} for member list access`);
      return NextResponse.json({ error: '管理者権限が必要です', status: 403 }); // 403 Forbidden
    }


    const participants = await db.roomParticipant.findMany({
      where: { roomId: roomId },
      include: { user: true } // ユーザー情報も取得
    });

    const participantList = participants.map(participant => ({
      userId: participant.userId,
      joinedAt: participant.joinedAt,
      // 必要に応じてユーザー情報を追加 (participant.user から取得)
    }));


    logger.info(`Participant list fetched for room ${roomId} by admin user ${user.userId}`);
    return NextResponse.json({ participants: participantList }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error getting participant list:', error);
    return NextResponse.json({ error: '参加者リストの取得に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});

// 参加者削除 (DELETE /api/rooms/{room_id}/members) - 管理者権限が必要
export const DELETE = withAdminRoomAuthorization(async function DELETE(request: Request, { params }: { params: { room_id: string } }, adminUser: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const roomId = params.room_id;
  const searchParams = new URL(request.url).searchParams;
  const userIdToDelete = searchParams.get('userId'); // 削除対象の userId をクエリパラメータから取得

  if (!userIdToDelete) {
    logger.warn(`User ID to delete missing in request for room ${roomId}`);
    return NextResponse.json({ error: '削除するユーザーIDを指定してください', status: 400 }); // 400 Bad Request
  }

  if (userIdToDelete === adminUser.userId) { // 管理者自身を削除しようとした場合
    logger.warn(`Admin user ${adminUser.userId} tried to delete themselves from room ${roomId}`);
    return NextResponse.json({ error: '管理者自身を削除することはできません', status: 400 }); // 400 Bad Request
  }


  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId }
    });
    if (!room) {
      logger.warn(`Room ${roomId} not found for member deletion`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 }); // 404 Not Found
    }
    if (room.adminUser !== adminUser.userId) { // 管理者ユーザーID を比較
      logger.warn(`User ${adminUser.userId} is not admin of room ${roomId} for member deletion`);
      return NextResponse.json({ error: '管理者権限が必要です', status: 403 }); // 403 Forbidden
    }


    const deletedParticipant = await db.roomParticipant.delete({
      where: {
        roomId_userId: { // 複合ユニークキーで削除
          roomId: roomId,
          userId: userIdToDelete,
        }
      },
    });

    if (!deletedParticipant) {
      logger.warn(`Participant ${userIdToDelete} not found in room ${roomId}`);
      return NextResponse.json({ error: '参加者が見つかりません', status: 404 }); // 404 Not Found
    }


    logger.info(`Participant ${userIdToDelete} deleted from room ${roomId} by admin user ${adminUser.userId}`);
    return NextResponse.json({ message: '参加者を削除しました', deletedUserId: userIdToDelete }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error deleting participant:', error);
    return NextResponse.json({ error: '参加者の削除に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});