/**
 * API ルート (/api/entry) のテスト例 (Jest を使用)
 *  - Jest と Supertest (または Next.js Test Utils) をインストールする必要あり
 *  - 例: npm install --dev jest supertest @types/jest @types/supertest
 */
import request from 'supertest';
import { describe, it, expect } from '@jest/globals'; // Jest の describe, it, expect を import
import { generateRoomId } from '@/src/lib/utils'; // テスト対象の関数を import (utils.ts を適切に調整する必要あり)
import { POST, GET } from '@/src/app/api/entry/route'; // テスト対象の API ルートを import


describe('API ルート /api/entry テスト', () => { // テストスイートを describe で定義

  it('POST /api/entry は新しいルームIDを生成して 201 Created を返す', async () => { // テストケースを it で定義
    const response = await POST(); // API ルートの POST 関数を直接実行 (request, context はモック化が必要な場合あり)
    const body = await response.json();

    expect(response.status).toBe(201); // ステータスコードが 201 Created であること

    expect(body.roomId).toBeDefined(); // レスポンスボディに roomId が含まれていること
    expect(body.roomId).toMatch(/^[0-9]{8}$/); // roomId が 8桁の数字であることを正規表現でチェック
  });


  it('GET /api/entry は既存のルームIDで 200 OK を返す', async () => {
    const roomId = generateRoomId(); // テスト用の Room ID を生成 (utils.ts の関数をモック化するか、テストデータを作成する必要がある場合あり)
    // TODO: テスト用の Room ID をデータベースに事前に登録する処理 (モックデータベース、またはテスト用データベースを使用)

    const requestMock = { // Request オブジェクトのモック (URLSearchParams をモック)
      url: `http://localhost:3000/api/entry?roomId=${roomId}`,
    } as Request;


    const response = await GET(requestMock); // API ルートの GET 関数を直接実行 (request, context はモック化が必要な場合あり)
    expect(response.status).toBe(200); // ステータスコードが 200 OK であること

    const body = await response.json();
    expect(body.roomId).toBe(roomId); // レスポンスボディの roomId がリクエストで指定した roomId と一致すること
  });


  it('GET /api/entry は存在しないルームIDで 404 Not Found を返す', async () => {
    const nonExistingRoomId = '99999999'; // 存在しない Room ID

    const requestMock = { // Request オブジェクトのモック
      url: `http://localhost:3000/api/entry?roomId=${nonExistingRoomId}`,
    } as Request;

    const response = await GET(requestMock); // API ルートの GET 関数を実行
    expect(response.status).toBe(404); // ステータスコードが 404 Not Found であること

    const body = await response.json();
    expect(body.error).toBe('Room not found or expired'); // エラーメッセージが期待どおりであること
  });


  // TODO: エラーケース、バリデーション、認証認可のテストケースなどを追加
  // 例:
  // - GET /api/entry?roomId= (roomId がない場合) は 400 Bad Request を返す
  // - 有効期限切れのルームID で GET /api/entry は 404 Not Found または 410 Gone を返す (実装による)
  // - POST /api/entry はエラー発生時に 500 Internal Server Error を返す
  // - ...


});