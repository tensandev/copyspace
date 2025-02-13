'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface UserManagementModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  roomId: string;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onRequestClose, roomId }) => {
  const [participants, setParticipants] = useState<any[]>([]); // 参加者リスト

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/members`);
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          alert('管理者権限が必要です。'); // 権限エラー
        } else {
          throw new Error(`参加者リスト取得エラー: ${response.status}`);
        }
        onRequestClose(); // エラー時はモーダルを閉じる
        return; // エラー時は処理中断
      }
      const data = await response.json();
      setParticipants(data.participants);
    } catch (error: any) {
      console.error('参加者リスト取得失敗:', error);
      alert('参加者リストの取得に失敗しました。');
      onRequestClose(); // エラー時はモーダルを閉じる
    }
  }, [roomId, onRequestClose]);


  useEffect(() => {
    if (isOpen) {
      fetchParticipants(); // モーダルが開いたら参加者リストを取得
    }
  }, [isOpen, fetchParticipants]);


  const handleRemoveParticipant = async (userIdToDelete: string) => {
    if (!window.confirm(`ユーザーID: ${userIdToDelete} を削除しますか？`)) {
      return; // キャンセルされた場合は処理中断
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/members?userId=${userIdToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          alert('管理者権限が必要です。'); // 権限エラー
        } else if (response.status === 400) {
          alert('不正なリクエストです。'); // クライアントエラー (例: 管理者自身を削除しようとした場合)
        }
        else {
          throw new Error(`参加者削除エラー: ${response.status}`);
        }
        return; // エラー時は処理中断
      }
      alert('参加者を削除しました。');
      fetchParticipants(); // 参加者リストを再取得して更新

    } catch (error: any) {
      console.error('参加者削除失敗:', error);
      alert('参加者の削除に失敗しました。');
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">ユーザー管理</h2>
        {participants.length === 0 ? (
          <p>参加者はいません。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {participants.map(participant => (
              <li key={participant.userId} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-semibold">{participant.userId}</p>
                  <p className="text-gray-500 text-sm">参加日時: {new Date(participant.joinedAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRemoveParticipant(participant.userId)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md text-sm"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}


        <div className="flex justify-end mt-4">
          <button onClick={onRequestClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;