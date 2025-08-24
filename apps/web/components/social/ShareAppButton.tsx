'use client';

import { useComposeCast } from '@coinbase/onchainkit/minikit';

interface ShareAppButtonProps {
  appUrl?: string;
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ShareAppButton({ 
  appUrl,
  text = 'Check out this amazing Mini App!',
  className = '',
  children = 'Share Mini App'
}: ShareAppButtonProps) {
  const { composeCast } = useComposeCast();

  const handleShareApp = () => {
    const embedUrl = appUrl || window.location.href;
    
    composeCast({
      text: text,
      embeds: [embedUrl]
    });
  };

  return (
    <button 
      onClick={handleShareApp}
      className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
