import React from 'react';
import Message from './Message';

interface MessageListProps {
  messages: { user: string; text: string; timestamp: Date }[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-2">
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </div>
  );
};

export default MessageList;