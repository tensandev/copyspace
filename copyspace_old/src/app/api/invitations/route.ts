import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminRoomAuthorization } from '@/lib/middleware'; // 管理者権限チェックミドルウェアをインポート
import { v4 as uuidv4 } from 'uuid'; // UUID 生成用ライブラリ
import { logger } from '@/lib/logger'; // logger をインポート
import { getAuthenticatedUser } from '@/lib/auth'; // 認証済みユーザー取得関数をインポート

// 招待状作成 (POST /api/invitations) - 管理者権限が必要
export const POST = withAdminRoomAuthorization(async function POST(request: Request, { params }: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) {
  const roomId = params.room_id;
  const reqBody = await request.json();
  const { receiverId } = reqBody; // 招待対象のユーザーID (オプション)

  const invitationCode = uuidv4(); // UUID 形式の招待コードを生成
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 招待状の有効期限: 24時間後

  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId }
    });
    if (!room) {
      logger.warn(`Room ${roomId} not found for invitation creation`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 }); // 404 Not Found
    }
    if (room.adminUser !== user.userId) { // 管理者ユーザーID を比較
      logger.warn(`User ${user.userId} is not admin of room ${roomId} for invitation creation`);
      return NextResponse.json({ error: '管理者権限が必要です', status: 403 }); // 403 Forbidden
    }


    const invitation = await db.invitation.create({
      data: {
        code: invitationCode,
        roomId: roomId,
        senderId: user.userId,
        receiverId: receiverId || null, // receiverId がない場合は公開招待状 (null を設定)
        expiresAt: expiresAt,
      },
    });

    // TODO: 招待メール送信処理 (receiverId がある場合) - メール送信処理は別途実装が必要

    logger.info(`Invitation code ${invitationCode} created for room ${roomId} by admin user ${user.userId}, receiver: ${receiverId || 'public'}`);
    return NextResponse.json({ invitationCode: invitationCode, expiresAt: invitation.expiresAt, message: '招待状を作成しました' }, { status: 201 }); // 201 Created

  } catch (error: any) {
    logger.error('Error creating invitation:', error);
    return NextResponse.json({ error: '招待状の作成に失敗しました', status: 500 }); // 500 Internal Server Error
  }
});


// 招待状検証 (GET /api/invitations) - 認証不要 (招待コードのみで検証)
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const invitationCode = searchParams.get('code'); // クエリパラメータから招待コードを取得

  if (!invitationCode) {
    logger.warn('Invitation code missing in request for verification');
    return NextResponse.json({ error: '招待コードが必要です', status: 400 }); // 400 Bad Request
  }

  try {
    const invitationVerificationResult = await verifyInvitationCode(invitationCode); // 招待状検証ミドルウェアの関数を直接利用
    if (invitationVerificationResult.errorResponse) {
      return invitationVerificationResult.errorResponse; // 検証失敗エラーレスポンスをそのまま返す
    }
    const invitation = invitationVerificationResult.invitation;

    logger.info(`Invitation code ${invitationCode} verified successfully for room ${invitation.roomId}`);
    return NextResponse.json({ message: '招待コードは有効です', roomId: invitation.roomId, invitationCode: invitation.code }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error verifying invitation code:', error);
    return NextResponse.json({ error: '招待コードの検証に失敗しました', status: 500 }); // 500 Internal Server Error
  }
}