import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { withRoomParticipation } from '@/lib/middleware'; // ルーム参加認証ミドルウェアをインポート
import { logger } from '@/lib/logger'; // logger をインポート

// メッセージ送信 (POST /api/messages) - ルーム参加認証が必要
export const POST = withRoomParticipation(async function POST(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) {
  try {
    const reqBody = await request.json();
    const { roomId, text } = reqBody; // roomId は middleware で検証済み

    if (!text) {
      logger.warn(`Message text missing in request for room ${roomId}`);
      return NextResponse.json({ error: 'メッセージを入力してください', status: 400 }); // 400 Bad Request
    }

    const encryptedText = encrypt(text); // メッセージを暗号化
    if (!encryptedText) {
      logger.error(`Message encryption failed for room ${roomId}`);
      return NextResponse.json({ error: 'メッセージの暗号化に失敗しました', status: 500 });
    }

    await db.message.create({
      data: {
        roomId: roomId!, // middleware で roomId が存在することを確認済み
        user: user.userId, // 認証済みユーザーの userId を使用
        messageText: encryptedText,
      },
    });

    // roomsテーブルの updatedAt を更新 (Prisma の updated_at は自動更新されるため、ここでは不要)
    // ... (updatedAt は Prisma で自動更新)

    logger.info(`Message sent to room ${roomId} by user ${user.userId}`);
    return NextResponse.json({ message: 'メッセージを送信しました' }, { status: 201 }); // 201 Created

  } catch (error: any) {
    logger.error('Error sending message:', error);
    return NextResponse.json({ error: 'メッセージの送信に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});

// メッセージ取得 (GET /api/messages?roomId=xxxxxxxxx) - ルーム参加認証は不要 (公開ルームを想定)
export async function GET(request: Request) { // ルーム参加認証を外しました (必要に応じて withRoomParticipation で保護)
  const searchParams = new URL(request.url).searchParams;
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    logger.warn('Room ID missing in request for get messages');
    return NextResponse.json({ error: 'ルームIDが必要です', status: 400 }); // 400 Bad Request
  }

  try {
    const messages = await db.message.findMany({
      where: { roomId: roomId },
      orderBy: { createdAt: 'asc' },
    });


    const decryptedMessages = messages.map(msg => ({
      user: msg.user,
      text: decrypt(msg.messageText), // 復号化
      timestamp: msg.createdAt,
    })).filter(msg => msg.text !== null) as { user: string, text: string, timestamp: Date }[]; // 復号化失敗メッセージフィルタリング


    logger.info(`Messages fetched for room ${roomId}`);
    return NextResponse.json({ messages: decryptedMessages }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error getting messages:', error);
    return NextResponse.json({ error: 'メッセージの取得に失敗しました', status: 500 }); // 500 Internal Server Error
  }
}