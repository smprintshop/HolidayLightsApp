import React, { useState } from 'react';
import { DisplaySubmission, VotingCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface LeaderboardProps {
  submissions: DisplaySubmission[];
  onSelectDisplay: (display: DisplaySubmission) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ submissions, onSelectDisplay }) => {
  const [activeTab, setActiveTab] = useState<VotingCategory>(VotingCategory.OVERALL);

  const sortedSubmissions = [...submissions].sort((a, b) => 
    (b.votes[activeTab] || 0) - (a.votes[activeTab] || 0)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Section */}
      <div className="px-6 pt-8 pb-4 flex-shrink-0">
        <h2 className="festive-font text-4xl text-red-600 mb-2">Hall of Fame</h2>
        <p className="text-slate-500 text-sm">Recognizing the most dazzling homes in Bluff Park.</p>
      </div>

      {/* Sticky Category Tabs with Horizontal Scroll */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
        <div className="relative">
          {/* Scrollable Container */}
          <div className="flex gap-2 overflow-x-auto px-6 py-4 scrollbar-hide snap-x">
            {Object.values(VotingCategory).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border snap-start ${
                  activeTab === cat 
                    ? `${CATEGORY_COLORS[cat]} text-white border-transparent shadow-md shadow-slate-200 scale-105` 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-red-200 active:scale-95'
                }`}
              >
                {cat}
              </button>
            ))}
            {/* Spacer to allow scrolling past the last item padding */}
            <div className="flex-shrink-0 w-4"></div>
          </div>
          
          {/* Visual Fades to indicate more scrollable content */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="flex-grow overflow-y-auto p-6 pb-36 scrollbar-hide">
        <div className="max-w-2xl mx-auto space-y-4">
          {sortedSubmissions.map((sub, index) => (
            <button 
              key={sub.id}
              onClick={() => onSelectDisplay(sub)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 group transition-all hover:shadow-md hover:border-red-200 text-left focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
            >
              {/* Rank Badge */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                index === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : 
                index === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-100' :
                index === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-100' : 
                'bg-slate-50 text-slate-400'
              }`}>
                {index + 1}
              </div>
              
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                <img 
                  src={sub.photos.find(p => p.isFeatured)?.url || sub.photos[0]?.url} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                  alt={sub.address} 
                />
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{sub.address}</h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {sub.description || 'A festive masterpiece in Bluff Park'}
                </p>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0 pl-2">
                <div className={`text-xl font-black ${index < 3 ? 'text-red-600' : 'text-slate-900'}`}>
                  {sub.votes[activeTab] || 0}
                </div>
                <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">VOTES</div>
              </div>
            </button>
          ))}

          {sortedSubmissions.length === 0 && (
            <div className="text-center py-24 px-6 bg-white/50 rounded-3xl border border-dashed border-slate-200">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-slate-800 font-bold mb-1">No entries found yet</h3>
              <p className="text-slate-400 text-xs">Be the first to vote or submit a house!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;