'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; // AuthContext をインポート

const EntryPage = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const router = useRouter();
  const [isPublicRoom, setIsPublicRoom] = useState(false); // 公開ルーム/招待制ルーム設定
  const [userIdInput, setUserIdInput] = useState(''); // ユーザーID 入力フィールド
  const [passwordInput, setPasswordInput] = useState(''); // パスワード入力フィールド
  const { login, register } = useAuth(); // AuthContext から login, register 関数を取得


  const handleCreateRoom = useCallback(async () => {
    try {
      // ユーザー登録処理 (開発環境のみ)
      if (process.env.NODE_ENV !== 'production') {
        if (!userIdInput || !passwordInput) {
          alert('ユーザーIDとパスワードを入力してください (開発環境のみユーザー登録が可能です)');
          return;
        }
        const registerResult = await register(userIdInput, passwordInput); // ユーザー登録
        if (!registerResult) {
          alert('ユーザー登録に失敗しました。');
          return;
        }
        alert('ユーザー登録に成功しました。ログインしてください。');
      }


      // ログイン処理
      if (!userIdInput || !passwordInput) {
        alert('ユーザーIDとパスワードを入力してください');
        return;
      }
      const loginResult = await login(userIdInput, passwordInput); // ログイン処理
      if (!loginResult) {
        alert('ログインに失敗しました。ユーザーIDとパスワードを確認してください。');
        return;
      }


      // ルーム作成処理
      const response = await fetch('/api/rooms', { // エンドポイントを /api/rooms に変更
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: isPublicRoom }), // 公開/招待制設定を送信
      });
      if (!response.ok) {
        throw new Error(`ルーム作成エラー: ${response.status}`);
      }
      const data = await response.json();
      router.push(`/entry/${data.roomId}`); // スペースページへリダイレクト

    } catch (error: any) {
      console.error('ルーム作成失敗:', error);
      alert('スペースの作成に失敗しました。');
    }
  }, [router, isPublicRoom, login, register, userIdInput, passwordInput]); // router, login, register, isPublicRoom, userIdInput, passwordInput を useCallback の依存関係に追加


  const handleJoinRoom = useCallback(async () => {
    if (roomIdInput) {
      try {
        // ログイン処理
        if (!userIdInput || !passwordInput) {
          alert('ユーザーIDとパスワードを入力してください');
          return;
        }
        const loginResult = await login(userIdInput, passwordInput); // ログイン処理
        if (!loginResult) {
          alert('ログインに失敗しました。ユーザーIDとパスワードを確認してください。');
          return;
        }


        router.push(`/entry/${roomIdInput}`); // 指定されたルームIDのスペースページへリダイレクト
      } catch (error: any) {
        console.error('ルーム参加時ログイン失敗:', error);
        alert('ルームへの参加に失敗しました (ログインエラー)。'); // より詳細なエラーメッセージ
      }

    } else {
      alert('ルームIDを入力してください。');
    }
  }, [router, roomIdInput, login, userIdInput, passwordInput]); // router, roomIdInput, login, userIdInput, passwordInput を useCallback の依存関係に追加


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="block text-gray-700 text-xl font-bold mb-6 text-center">コピースペースへようこそ</h2>

        {process.env.NODE_ENV !== 'production' && ( // 開発環境でのみユーザー登録フォームを表示
          <div className="mb-4">
            <h3 className="block text-gray-700 text-lg font-bold mb-4 text-center">ユーザー登録 (開発環境のみ)</h3>
            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userIdRegister">
                ユーザーID
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="userIdRegister"
                type="text"
                placeholder="ユーザーIDを入力"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passwordRegister">
                パスワード
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="passwordRegister"
                type="password"
                placeholder="パスワードを入力"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
            <button onClick={handleCreateRoom} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4">
              新しいスペースを作成 & ユーザー登録
            </button>
          </div>
        )}


        <div className="mb-4 flex items-center justify-center space-x-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600"
              checked={isPublicRoom}
              onChange={(e) => setIsPublicRoom(e.target.checked)}
            />
            <span className="ml-2 text-gray-700 text-sm">公開ルーム</span>
          </label>
          <button onClick={handleCreateRoom} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            新しいスペースを作成 {process.env.NODE_ENV === 'production' ? '' : '(ログイン必須)'}
          </button>
        </div>


        <div className="mb-2">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomId">
            スペースIDで参加
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="roomId"
            type="text"
            placeholder="ルームIDを入力"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userIdLogin">
            ユーザーID
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="userIdLogin"
            type="text"
            placeholder="ユーザーIDを入力"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passwordLogin">
            パスワード
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="passwordLogin"
            type="password"
            placeholder="パスワードを入力"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
        </div>


        <div className="flex items-center justify-between">
          <button onClick={handleJoinRoom} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
            参加 {process.env.NODE_ENV === 'production' ? '(ログイン必須)' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryPage;