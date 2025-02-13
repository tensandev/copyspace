'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const HomePage = () => {
  const router = useRouter();

  const handleStartButtonClick = () => {
    router.push('/entry');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">コピースペースへようこそ</h1>
      <p className="text-gray-600 mb-8 text-center">
        セキュアで приват なメッセージング空間を体験してください。<br />
        ルームを作成、または既存のルームに参加して、<br />
        機密性の高い情報交換を安全に行うことができます。
      </p>
      <button
        onClick={handleStartButtonClick}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline"
      >
        始める
      </button>
    </div>
  );
};

export default HomePage;