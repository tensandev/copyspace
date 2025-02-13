'use client';

import React, { useState, useCallback } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard'; // クリップボードコピー用ライブラリ (npm install react-copy-to-clipboard)

interface InvitationModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  roomId: string;
}

const InvitationModal: React.FC<InvitationModalProps> = ({ isOpen, onRequestClose, roomId }) => {
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isCopied, setIsCopied] = useState(false); // クリップボードコピー状態
  const invitationLink = invitationCode ? `${process.env.BASE_URL}/entry/${roomId}?invitationCode=${invitationCode}` : ''; // 招待リンクを生成

  const handleCreateInvitation = useCallback(async () => {
    try {
      const response = await fetch(`/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomId }), // receiverId は省略 (公開招待状)
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          alert('管理者権限が必要です。'); // 権限エラー
        } else {
          throw new Error(`招待状作成エラー: ${response.status}`);
        }
        return; // エラー時は処理中断
      }
      const data = await response.json();
      setInvitationCode(data.invitationCode);
      setExpiryDate(new Date(data.expiresAt));
      setIsCopied(false); // 新しい招待コード生成時にコピー状態をリセット
    } catch (error: any) {
      console.error('招待状作成失敗:', error);
      alert('招待状の作成に失敗しました。');
    }
  }, [roomId]);

  const handleCopy = useCallback(() => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // 2秒後にコピー状態をリセット
  }, []);


  useEffect(() => {
    if (isOpen) {
      handleCreateInvitation(); // モーダルが開いたら招待状を自動生成
      setIsCopied(false); // モーダルが開くたびにコピー状態をリセット
    } else {
      setInvitationCode(null); // モーダルが閉じたら招待コードをクリア
      setExpiryDate(null);
      setIsCopied(false);
    }
  }, [isOpen, handleCreateInvitation]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">招待</h2>
        {invitationCode ? (
          <div>
            <p className="text-gray-700 mb-2">招待リンクをコピーして共有してください。</p>
            <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between mb-4">
              <input
                type="text"
                value={invitationLink}
                className="bg-gray-100 text-gray-700 w-full focus:outline-none readOnly"
                readOnly
                onClick={(e) => e.target.select()} // リンクをクリック時に自動選択
              />
              <CopyToClipboard text={invitationLink} onCopy={handleCopy}>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md ml-2 text-sm">
                  コピー
                </button>
              </CopyToClipboard>
            </div>
            {isCopied && <p className="text-green-500 text-sm mb-2">コピーしました!</p>}
            <p className="text-gray-500 text-sm">
              有効期限: {expiryDate?.toLocaleString()}
            </p>
          </div>
        ) : (
          <p>招待状を作成中です...</p>
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

export default InvitationModal;