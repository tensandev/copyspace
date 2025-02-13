'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import InputField from '@/app/components/InputField';
import MessageList from '@/app/components/MessageList';
import SettingButton from '@/app/components/SettingButton';
import RoomSettingModal from '@/app/components/RoomSettingModal';
import AdminSettingModal from '@/app/components/AdminSettingModal';
import UserManagementModal from '@/app/components/UserManagementModal'; // UserManagementModal コンポーネントをインポート
import InvitationModal from '@/app/components/InvitationModal'; // InvitationModal コンポーネントをインポート
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext'; // AuthContext をインポート


interface SpacePageProps {
  params: {
    room_id: string;
  };
}

const SpacePage: React.FC<SpacePageProps> = () => {
  const { room_id } = useParams(); // useParams フックを使用
  const router = useRouter();
  const [messages, setMessages] = useState<{ user: string, text: string, timestamp: Date }[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [isRoomSettingModalOpen, setIsRoomSettingModalOpen] = useState(false);
  const [isAdminSettingModalOpen, setIsAdminSettingModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false); // ユーザー管理モーダルの表示状態
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false); // 招待モーダルの表示状態

  const [isAdminUser, setIsAdminUser] = useState(false); // 管理者ユーザーかどうか
  const { userId: loggedInUserId } = useAuth(); // AuthContext から userId を取得

  useEffect(() => {
    // 管理者判定を Context の情報に基づいて行うように変更
    setIsAdminUser(loggedInUserId != null); // 簡易的な管理者判定 (ログインしていれば管理者とみなす) - 実際にはサーバー側で判定


  }, [loggedInUserId]);


  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?roomId=${room_id}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/entry'); // 未認証エラー時はエントリページへリダイレクト (ログインを促す)
          } else {
            throw new Error(`メッセージ取得エラー: ${response.status}`);
          }
          return; // エラー時は処理中断
        }
        const data = await response.json();
        setMessages(data.messages);
      } catch (error: any) {
        console.error('メッセージ取得失敗:', error);
        alert('メッセージの取得に失敗しました。');
      }
    };

    fetchMessages(); // 初回メッセージ取得
    const intervalId = setInterval(fetchMessages, 1000); // 1秒ごとにポーリング

    return () => clearInterval(intervalId); // コンポーネントアンマウント時にインターバルをクリア
  }, [room_id, router]); // router を依存関係に追加


  useEffect(() => {
    // メッセージリストが更新されたらスクロール
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: room_id, text }), // ユーザー名はサーバー側で認証情報から取得
      });

      if (!response.ok) {
        if (response.status === 403) {
          alert('ルームへの参加が必要です。'); // 参加権限エラー
        } else {
          throw new Error(`メッセージ送信エラー: ${response.status}`);
        }
        return; // エラー時は処理中断
      }
      // 送信成功後の処理 (メッセージリスト再取得)
      fetch(`/api/messages?roomId=${room_id}`)
        .then(response => response.json())
        .then(data => setMessages(data.messages))
        .catch(error => console.error('メッセージリスト更新エラー:', error));


    } catch (error: any) {
      console.error('メッセージ送信失敗:', error);
      alert('メッセージの送信に失敗しました。');
    }
  }, [room_id]); // room_id を useCallback の依存関係に追加


  const handleExportJson = useCallback(async () => {
    try {
      const response = await fetch(`/api/export/${room_id}`);
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          alert('管理者権限が必要です。'); // 権限エラー (未認証 or 管理者権限なし)
        } else {
          throw new Error(`JSONエクスポートエラー: ${response.status}`);
        }
        return; // 権限エラー時は処理中断
      }
      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `copyspace_${room_id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('JSONエクスポート失敗:', error);
      alert('JSONエクスポートに失敗しました。');
    }
  }, [room_id]); // room_id を useCallback の依存関係に追加


  const handleDeleteRoom = useCallback(async () => {
    if (!window.confirm('本当にこのスペースを削除しますか？')) {
      return; // キャンセルされた場合は処理中断
    }
    try {
      const response = await fetch(`/api/rooms/${room_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          alert('管理者権限が必要です。'); // 権限エラー (未認証 or 管理者権限なし)
        } else {
          throw new Error(`スペース削除エラー: ${response.status}`);
        }
        return; // 権限エラー時は処理中断
      }
      alert('スペースを削除しました。');
      router.push('/entry'); // トップページへリダイレクト
    } catch (error: any) {
      console.error('スペース削除失敗:', error);
      alert('スペースの削除に失敗しました。');
    }
  }, [room_id, router]); // router, room_id を useCallback の依存関係に追加


  const handleExtendExpiry = useCallback(async (extendDays: number) => {
    try {
      const response = await fetch(`/api/rooms/${room_id}/extend-expiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extendDays }),
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          alert('管理者権限が必要です。'); // 権限エラー (未認証 or 管理者権限なし)
        } else if (response.status === 400) {
          alert('無効な延長日数です。'); // クライアントエラー
        }
        else {
          throw new Error(`有効期限延長エラー: ${response.status}`);
        }
        return; // エラー時は処理中断
      }
      const data = await response.json();
      alert(`有効期限を${extendDays}日延長しました。\n新しい有効期限: ${new Date(data.expiresAt).toLocaleString()}`); // 有効期限をtoLocaleString() で整形
      setIsRoomSettingModalOpen(false); // モーダルを閉じる
    } catch (error: any) {
      console.error('有効期限延長失敗:', error);
      alert('有効期限の延長に失敗しました。');
    }
  }, [room_id]); // room_id を useCallback の依存関係に追加

  const handleOpenUserManagement = useCallback(() => {
    setIsUserManagementModalOpen(true);
  }, []);

  const handleOpenInvitationModal = useCallback(() => {
    setIsInvitationModalOpen(true);
  }, []);


  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-100 p-4">
        <h1 className="text-xl font-bold">コピースペース - Room ID: {room_id}</h1>
      </header>
      <div ref={messagesRef} className="flex-1 p-4 overflow-y-scroll">
        <MessageList messages={messages} />
      </div>
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <InputField onSendMessage={handleSendMessage} />
        <div className="flex space-x-2">
          {isAdminUser && (
            <>
              <SettingButton onClick={() => setIsRoomSettingModalOpen(true)}>ルーム設定</SettingButton>
              <SettingButton onClick={handleOpenUserManagement}>ユーザー管理</SettingButton>
              <SettingButton onClick={handleOpenInvitationModal}>招待</SettingButton>
              <SettingButton onClick={() => setIsAdminSettingModalOpen(true)}>管理者設定</SettingButton>
            </>
          )}
          <button onClick={handleExportJson} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            JSONエクスポート
          </button>
        </div>
      </div>

      {/* ルーム設定モーダル */}
      <RoomSettingModal
        isOpen={isRoomSettingModalOpen}
        onRequestClose={() => setIsRoomSettingModalOpen(false)}
        onExtendExpiry={handleExtendExpiry}
      />

      {/* 管理者設定モーダル */}
      <AdminSettingModal
        isOpen={isAdminSettingModalOpen}
        onRequestClose={() => setIsAdminSettingModalOpen(false)}
        onDeleteRoom={handleDeleteRoom}
      />

      {/* ユーザー管理モーダル */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onRequestClose={() => setIsUserManagementModalOpen(false)}
        roomId={room_id}
      />

      {/* 招待モーダル */}
      <InvitationModal
        isOpen={isInvitationModalOpen}
        onRequestClose={() => setIsInvitationModalOpen(false)}
        roomId={room_id}
      />


    </div>
  );
};

export default SpacePage;