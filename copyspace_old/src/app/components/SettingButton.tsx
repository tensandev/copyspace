import React, { ReactNode } from 'react';

interface SettingButtonProps {
  onClick: () => void;
  children: ReactNode;
}

const SettingButton: React.FC<SettingButtonProps> = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
    >
      {children}
    </button>
  );
};

export default SettingButton;