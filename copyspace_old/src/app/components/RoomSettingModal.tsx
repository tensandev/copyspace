'use client';

import React, { useState, useCallback } from 'react';

interface RoomSettingModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onExtendExpiry: (days: number) => Promise<void>;
}

const RoomSettingModal: React.FC<RoomSettingModalProps> = ({ isOpen, onRequestClose, onExtendExpiry }) => {
  const [extendDays, setExtendDays] = useState<number | ''>('');
  const [isExtending, setIsExtending] = useState(false);
  const [extendError, setExtendError] = useState('');

  const handleExtendExpiryClick = useCallback(async () => {
    if (!extendDays) {
      setExtendError('延長日数を選択してください。');
      return;
    }
    const days = Number(extendDays);
    if (isNaN(days) || ![2, 5, 7].includes(days)) {
      setExtendError('無効な延長日数です。');
      return;
    }

    setIsExtending(true);
    setExtendError('');
    try {
      await onExtendExpiry(days);
      onRequestClose(); // 成功したらモーダルを閉じる
    } catch (error: any) {
      console.error('有効期限延長エラー:', error);
      setExtendError('有効期限の延長に失敗しました。');
    } finally {
      setIsExtending(false);
    }
  }, [extendDays, onExtendExpiry, onRequestClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-lg font-bold mb-4">ルーム設定</h2>

        <div className="mb-4">
          <label htmlFor="extendDays" className="block text-gray-700 text-sm font-bold mb-2">
            有効期限延長
          </label>
          <select
            id="extendDays"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={extendDays}
            onChange={(e) => setExtendDays(e.target.value)}
            disabled={isExtending}
          >
            <option value="">選択してください</option>
            <option value="2">2日</option>
            <option value="5">5日</option>
            <option value="7">7日</option>
          </select>
        </div>

        {extendError && <p className="text-red-500 text-sm mb-4">{extendError}</p>}

        <div className="flex justify-end">
          <button
            onClick={onRequestClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            disabled={isExtending}
          >
            キャンセル
          </button>
          <button
            onClick={handleExtendExpiryClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isExtending}
          >
            {isExtending ? '延長中...' : '延長する'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingModal;