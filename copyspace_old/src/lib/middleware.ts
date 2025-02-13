import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isAuthenticatedRoomParticipant, isAdminRoomParticipant, verifyInvitationCode } from './auth';
import { logger } from './logger'; // logger をインポート

// 認証チェックミドルウェア (認証のみ)
export const withAuthentication = (handler: (req: NextRequest, params: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) => Promise<NextResponse>) => {
  return async (req: NextRequest, params: { params: { room_id: string } }) => {
    const authResult = await getAuthenticatedUser(req);
    if (authResult.errorResponse) {
      logger.warn(`Authentication failed: ${authResult.errorResponse.status} - ${authResult.errorResponse.statusText} - ${req.url}`);
      return authResult.errorResponse; // 認証失敗時はエラーレスポンスを返す
    }
    return handler(req, params, authResult.user!); // 認証成功時はハンドラーを実行
  };
};


// ルーム参加認証ミドルウェア (ルーム参加 + 認証)
export const withRoomParticipation = (handler: (req: NextRequest, params: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) => Promise<NextResponse>) => {
  return async (req: NextRequest, params: { params: { room_id: string } }) => {
    const roomId = params.params.room_id;
    if (!roomId) {
      logger.warn(`Room ID missing in URL: ${req.url}`);
      return NextResponse.json({ error: 'Room ID is missing in URL', status: 400 }); // 400 Bad Request
    }
    const authResult = await isAuthenticatedRoomParticipant(req, roomId);
    if (authResult.errorResponse) {
      logger.warn(`Room participation authentication failed: ${authResult.errorResponse.status} - ${authResult.errorResponse.statusText} - ${req.url}`);
      return authResult.errorResponse; // 認証失敗時はエラーレスポンスを返す
    }
    return handler(req, params, authResult.user!); // 認証成功時はハンドラーを実行
  };
};


// 管理者権限チェックミドルウェア (管理者権限 + ルーム参加 + 認証)
export const withAdminRoomAuthorization = (handler: (req: NextRequest, params: { params: { room_id: string } }, user: { userId: string, roomId: string | null, isAdmin: boolean }) => Promise<NextResponse>) => {
  return async (req: NextRequest, params: { params: { room_id: string } }) => {
    const roomId = params.params.room_id;
    if (!roomId) {
      logger.warn(`Room ID missing in URL for admin action: ${req.url}`);
      return NextResponse.json({ error: 'Room ID is missing in URL', status: 400 }); // 400 Bad Request
    }
    const adminAuthResult = await isAdminRoomParticipant(req, roomId);
    if (adminAuthResult.errorResponse) {
      logger.warn(`Admin authorization failed: ${adminAuthResult.errorResponse.status} - ${adminAuthResult.errorResponse.statusText} - ${req.url}`);
      return adminAuthResult.errorResponse; // 認証・認可失敗時はエラーレスポンスを返す
    }
    return handler(req, params, adminAuthResult.user!); // 管理者権限あり、ハンドラー実行
  };
};


// 招待状検証ミドルウェア
export const withInvitationVerification = (handler: (req: NextRequest, params: { params: { invitationCode: string } }, invitation: any) => Promise<NextResponse>) => {
  return async (req: NextRequest, params: { params: { invitationCode: string } }) => {
    const invitationCode = params.params.invitationCode;
    const invitationVerificationResult = await verifyInvitationCode(invitationCode);

    if (invitationVerificationResult.errorResponse) {
      logger.warn(`Invitation verification failed: ${invitationVerificationResult.errorResponse.status} - ${invitationVerificationResult.errorResponse.statusText} - ${req.url}`);
      return invitationVerificationResult.errorResponse; // 招待状検証失敗時はエラーレスポンスを返す
    }
    return handler(req, params, invitationVerificationResult.invitation); // 招待状検証成功時はハンドラーを実行
  };
};