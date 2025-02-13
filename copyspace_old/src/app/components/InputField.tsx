import React, { useState, useCallback } from 'react';

interface InputFieldProps {
  onSendMessage: (text: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({ onSendMessage }) => {
  const [messageText, setMessageText] = useState('');

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(event.target.value);
  }, []);

  const handleSendMessageClick = useCallback(() => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  }, [messageText, onSendMessage]);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && messageText.trim()) {
      event.preventDefault(); // デフォルトの改行を防ぐ
      onSendMessage(messageText);
      setMessageText('');
    }
  }, [messageText, onSendMessage]);

  return (
    <div className="flex rounded-md border border-gray-300 overflow-hidden shadow-sm">
      <input
        type="text"
        className="flex-grow px-4 py-2 focus:outline-none h-10"
        placeholder="メッセージを入力してください..."
        value={messageText}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
      />
      <button
        onClick={handleSendMessageClick}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 focus:outline-none h-10"
      >
        送信
      </button>
    </div>
  );
};

export default InputField;