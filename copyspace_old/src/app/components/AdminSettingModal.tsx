'use client';

import React, { useState, useCallback } from 'react';

interface AdminSettingModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onDeleteRoom: () => Promise<void>;
}

const AdminSettingModal: React.FC<AdminSettingModalProps> = ({ isOpen, onRequestClose, onDeleteRoom }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteRoomClick = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDeleteRoom();
      onRequestClose(); // 削除成功したらモーダルを閉じる (実際には onDeleteRoom 内でリダイレクト処理)
    } catch (error: any) {
      console.error('ルーム削除エラー:', error);
      setDeleteError('ルームの削除に失敗しました。');
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteRoom, onRequestClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-lg font-bold mb-4">管理者設定</h2>

        {deleteError && <p className="text-red-500 text-sm mb-4">{deleteError}</p>}

        <div className="flex justify-end">
          <button
            onClick={onRequestClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            disabled={isDeleting}
          >
            キャンセル
          </button>
          <button
            onClick={handleDeleteRoomClick}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : 'スペースを削除する'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingModal;