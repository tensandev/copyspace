import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRoomId } from '@/lib/utils';
import { generateToken, setAuthCookie, getAuthenticatedUser } from '@/lib/auth';
import { logger } from '@/lib/logger'; // logger をインポート

// スペース作成 (POST /api/entry) - 認証が必要
export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request); // 認証済みユーザーを取得
    if (authResult.errorResponse) {
      return authResult.errorResponse; // 認証エラーレスポンスをそのまま返す
    }
    const userId = authResult.user?.userId;
    if (!userId) {
      logger.error('Authenticated user ID not found'); // ユーザーID が取得できないのはシステムエラー
      return NextResponse.json({ error: '認証ユーザーIDを取得できませんでした', status: 500 }); // 500 Internal Server Error (本来は起こらないはず)
    }


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
        adminUser: userId, // 作成者を管理者として設定
      },
    });

    // ルーム作成者を RoomParticipant に追加
    await db.roomParticipant.create({
      data: {
        roomId: roomId,
        userId: userId,
        joinedAt: now,
      },
    });


    const tokenPayload = { userId: userId, roomId: roomId, isAdmin: true }; // 作成者は管理者
    const token = await generateToken(tokenPayload); // JWT トークン生成
    await setAuthCookie(token); // Cookie に JWT トークン設定

    logger.info(`Room ${roomId} created by user ${userId}`);
    return NextResponse.json({ roomId: roomId, message: 'スペースを作成しました' }, { status: 201 }); // 201 Created

  } catch (error: any) {
    logger.error('Error creating room:', error);
    return NextResponse.json({ error: 'スペースの作成に失敗しました', status: 500 }); // 500 Internal Server Error
  }
}

// スペース参加 (GET /api/entry?roomId=xxxxxxxxx) - 公開ルームは認証不要、招待制ルームは招待状検証が必要 (未実装)
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const roomId = searchParams.get('roomId');
  const invitationCode = searchParams.get('invitationCode'); // 招待コードをクエリパラメータから取得


  if (!roomId) {
    logger.warn('Room ID missing in request');
    return NextResponse.json({ error: 'ルームIDが必要です', status: 400 }); // 400 Bad Request
  }

  try {
    const room = await db.room.findUnique({
      where: { roomId: roomId },
      include: { invitations: true, participants: true } // 招待状と参加者情報を取得
    });

    if (!room) {
      logger.warn(`Room ${roomId} not found`);
      return NextResponse.json({ error: 'ルームが見つかりません', status: 404 }); // 404 Not Found
    }

    if (room.expiresAt < new Date()) {
      // 有効期限切れのルームは削除 (自動削除処理)
      await db.room.delete({ where: { roomId: roomId } }); // 関連するメッセージと参加者も cascade delete
      logger.info(`Expired room ${roomId} automatically deleted`);
      return NextResponse.json({ error: 'ルームの有効期限が切れました', status: 410 }); // 410 Gone (期限切れ)
    }


    if (!room.isPublic) {
      if (!invitationCode) {
        logger.warn(`Private room ${roomId} access without invitation code`);
        return NextResponse.json({ error: '招待制ルームです。招待コードを入力してください', status: 403 }); // 403 Forbidden (招待コードが必要)
      }
      const invitationVerificationResult = await verifyInvitationCode(invitationCode); // 招待状検証
      if (invitationVerificationResult.errorResponse) {
        return invitationVerificationResult.errorResponse; // 招待状検証エラーレスポンスをそのまま返す
      }

      // 招待状が有効な場合、参加処理を続行 (招待状の receiverId が設定されている場合はユーザー認証も必要になるケースも - 今回は簡易化)
      // ... (招待状検証 OK 時の処理 - ここでは認証済ユーザーの参加処理は省略)


    }


    // 公開ルームまたは招待状検証済みの招待制ルームの場合、参加処理
    return NextResponse.json({ roomId: room.roomId, message: 'ルームに参加しました' }, { status: 200 }); // 200 OK

  } catch (error: any) {
    logger.error('Error joining room:', error);
    return NextResponse.json({ error: 'ルームへの参加に失敗しました', status: 500 }); // 500 Internal Server Error
  }
}