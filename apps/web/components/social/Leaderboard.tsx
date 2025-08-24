'use client';

import { useViewProfile } from '@coinbase/onchainkit/minikit';

interface Player {
  fid: string;
  name: string;
  score: number;
  avatar?: string;
}

interface LeaderboardProps {
  players: Player[];
  className?: string;
}

interface PlayerRowProps {
  player: Player;
  rank: number;
}

function PlayerRow({ player, rank }: PlayerRowProps) {
  const viewProfile = useViewProfile();

  const handleViewProfile = () => {
    viewProfile(parseInt(player.fid));
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold text-gray-400 w-8">#{rank}</span>
        {player.avatar && (
          <img 
            src={player.avatar} 
            alt={`${player.name}'s avatar`}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="font-medium text-gray-900">{player.name}</span>
      </div>
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold text-blue-600">{player.score}</span>
        <button 
          onClick={handleViewProfile}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

export default function Leaderboard({ players, className = '' }: LeaderboardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Top Players</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {players.map((player, index) => (
          <PlayerRow 
            key={player.fid}
            player={player}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
