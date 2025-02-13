import React from 'react';

interface MessageProps {
  message: { user: string; text: string; timestamp: Date };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline">
        <span className="font-semibold mr-2">{message.user}</span>
        <time className="text-gray-500 text-sm">{new Date(message.timestamp).toLocaleString()}</time>
      </div>
      <p className="ml-2 break-words">{message.text}</p>
    </div>
  );
};

export default Message;