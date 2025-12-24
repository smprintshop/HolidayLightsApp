import React, { useState } from 'react';
import { DisplaySubmission, VotingCategory, User } from '../types';
import { MAX_VOTES_PER_ADDRESS, CATEGORY_COLORS } from '../constants';

interface DisplayDetailsProps {
  display: DisplaySubmission;
  user: User | null;
  onClose: () => void;
  onVote: (category: VotingCategory) => void;
}

const DisplayDetails: React.FC<DisplayDetailsProps> = ({ display, user, onClose, onVote }) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const votesRemaining = user ? (user.votesRemainingPerAddress[display.id] ?? MAX_VOTES_PER_ADDRESS) : 0;
  const submitterName = [display.firstName, display.lastName].filter(Boolean).join(' ');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-end md:justify-center p-2 md:p-4">
        <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[95dvh] md:max-h-[90dvh] flex flex-col landscape:flex-row">
          
          {/* Left / Top Side: Media Section */}
          <div className="flex flex-col landscape:w-1/2 bg-slate-100 flex-shrink-0">
            <div className="relative aspect-video landscape:aspect-auto landscape:flex-grow overflow-hidden bg-slate-200">
              <img 
                src={display.photos[activePhotoIdx].url} 
                alt="Light display"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setIsFullscreen(true)}
              />
              <button 
                onClick={onClose} 
                className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10 landscape:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Thumbnails Tray */}
            <div className="bg-slate-200/50 p-3 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
              {display.photos.map((p, i) => (
                <button 
                  key={p.id} 
                  onClick={() => setActivePhotoIdx(i)}
                  className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                    activePhotoIdx === i ? 'border-red-500 scale-105 shadow-md shadow-red-100' : 'border-white opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right / Bottom Side: Content Section */}
          <div className="flex flex-col landscape:w-1/2 p-4 pb-24 md:p-6 md:pb-24 overflow-y-auto relative bg-white">
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 bg-slate-100 text-slate-400 p-2 rounded-full hover:bg-slate-200 transition-colors hidden landscape:block"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex justify-between items-start mb-4 pr-10">
              <div className="flex-grow">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 break-words leading-tight">{display.address}</h2>
                {submitterName && (
                  <p className="text-[10px] md:text-xs font-semibold text-red-600 uppercase tracking-wider mt-1">By {submitterName}</p>
                )}
              </div>
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold text-xs md:text-sm flex items-center gap-1 border border-red-100 flex-shrink-0">
                ✨ {display.totalVotes}
              </div>
            </div>

            <p className="text-sm text-slate-500 italic mb-8 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              {display.description || "A magical light display in Bluff Park."}
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm md:text-base">{user ? 'Cast Your Vote' : 'Voting'}</h3>
                {user && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${votesRemaining > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {votesRemaining} left
                  </span>
                )}
              </div>

              {user ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(VotingCategory).map((cat) => (
                    <button
                      key={cat}
                      disabled={votesRemaining <= 0}
                      onClick={() => onVote(cat)}
                      className={`flex flex-col items-center justify-center p-2.5 md:p-3 rounded-2xl border transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${CATEGORY_COLORS[cat]} bg-opacity-5 border-opacity-20 hover:bg-opacity-10`}
                    >
                      <span className={`w-2 h-2 rounded-full mb-1.5 md:mb-2 ${CATEGORY_COLORS[cat]}`}></span>
                      <span className="text-[9px] md:text-[10px] font-bold text-center leading-tight uppercase text-slate-700">{cat}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-semibold text-slate-700">Please sign in to vote!</p>
                    <p className="text-xs text-slate-500 mt-1">Head to the 'You' tab to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-end z-[110] pointer-events-none">
            <button 
              className="text-white bg-white/20 hover:bg-white/40 p-2 md:p-3 rounded-full backdrop-blur-md transition-colors pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-grow flex items-center justify-center p-4 min-h-0">
            <img 
              src={display.photos[activePhotoIdx].url} 
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-shrink-0 bg-slate-900/80 backdrop-blur-xl p-4 md:p-6 border-t border-white/10 flex justify-center items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide w-full"
               onClick={(e) => e.stopPropagation()}>
            {display.photos.map((p, i) => (
              <button 
                key={p.id} 
                onClick={() => setActivePhotoIdx(i)}
                className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  activePhotoIdx === i ? 'border-white scale-110 shadow-lg ring-4 ring-white/10' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                }`}
              >
                <img src={p.url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default DisplayDetails;