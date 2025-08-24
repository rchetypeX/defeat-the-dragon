'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';

interface ShareButtonProps {
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ShareButton({ 
  text = 'Just completed the daily puzzle! 🧩',
  className = '',
  children = 'Share Achievement'
}: ShareButtonProps) {
  const { composeCast } = useComposeCast();

  const handleShare = () => {
    composeCast({
      text: text
    });
  };

  return (
    <button 
      onClick={handleShare}
      className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
