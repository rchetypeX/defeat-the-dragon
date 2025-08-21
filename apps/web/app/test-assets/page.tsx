'use client';

export default function TestAssetsPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Forest Scene */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/assets/images/forest-background.png" 
          alt="Forest Background" 
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          onError={(e) => {
            console.error('❌ Forest background failed to load');
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
          onLoad={() => {
            console.log('✅ Forest background loaded successfully');
          }}
        />
        <div className="absolute inset-0 bg-red-500 opacity-80 hidden">
          <div className="flex items-center justify-center h-full text-white text-2xl font-bold">
            ❌ FOREST BACKGROUND FAILED TO LOAD
          </div>
        </div>
      </div>
      
      {/* Test Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="bg-black bg-opacity-75 text-white p-8 rounded-lg text-center">
          <h1 className="text-3xl font-bold mb-4">🌲 Forest Background Test</h1>
          <p className="text-lg mb-4">If you can see the forest background behind this text, it's working!</p>
          <p className="text-sm">Check the console for load/error messages.</p>
          <div className="mt-4">
            <a href="/" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">
              Back to Game
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
