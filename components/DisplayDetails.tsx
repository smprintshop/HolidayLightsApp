import React, { useState } from 'react';
import { DisplaySubmission, VotingCategory, User, ViewType } from '../types';
import { MAX_VOTES_PER_ADDRESS, CATEGORY_COLORS } from '../constants';

interface DisplayDetailsProps {
  display: DisplaySubmission;
  user: User | null;
  onClose: () => void;
  onVote: (category: VotingCategory, delta: number) => void;
  onNavigate: (view: ViewType) => void;
  onReport?: (id: string) => void;
}

const DisplayDetails: React.FC<DisplayDetailsProps> = ({ display, user, onClose, onVote, onNavigate, onReport }) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  
  const votesRemaining = user ? (user.votesRemainingPerAddress[display.id] ?? MAX_VOTES_PER_ADDRESS) : 0;
  const submitterName = [display.firstName, display.lastName].filter(Boolean).join(' ');

  const handleSignInClick = () => {
    onClose();
    onNavigate('PROFILE');
  };

  const handleReport = () => {
    if (window.confirm("Report this display for inappropriate content?")) {
      onReport?.(display.id);
      setHasReported(true);
      setTimeout(onClose, 1500);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-end md:justify-center p-2 md:p-4">
        <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[95dvh] md:max-h-[90dvh] flex flex-col landscape:flex-row relative">
          
          {hasReported && (
            <div className="absolute inset-0 z-[60] bg-white/95 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"/></svg>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Thank You</h3>
              <p className="text-slate-500 text-sm">This display has been flagged for review.</p>
            </div>
          )}

          <div className="flex flex-col landscape:w-1/2 bg-slate-100 flex-shrink-0 relative">
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

          <div className="flex flex-col landscape:w-1/2 p-4 pb-24 md:p-6 md:pb-24 overflow-y-auto relative bg-white">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={handleReport}
                className="bg-slate-50 text-slate-300 p-2 rounded-full hover:bg-red-50 hover:text-red-400 transition-all group"
                title="Report Content"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
              </button>
              <button 
                onClick={onClose} 
                className="bg-slate-100 text-slate-400 p-2 rounded-full hover:bg-slate-200 transition-colors hidden landscape:block"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex justify-between items-start mb-4 pr-20">
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
              {!user && (
                <button 
                  onClick={handleSignInClick}
                  className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-300 hover:bg-red-100 transition-colors group cursor-pointer block"
                >
                    <p className="text-sm font-bold text-red-600 group-hover:underline">Please sign in to vote!</p>
                    <p className="text-xs text-red-500 mt-1">Head to the 'You' tab to get started.</p>
                </button>
              )}

              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-800 text-sm md:text-base">{user ? 'Cast Your Vote' : 'Current Standings'}</h3>
                {user && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${votesRemaining > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {votesRemaining} votes left
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {Object.values(VotingCategory).map((cat) => (
                  <div
                    key={cat}
                    className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border border-slate-100 bg-white transition-all hover:bg-slate-50 shadow-sm`}
                  >
                    <span className="text-[10px] md:text-xs font-black uppercase text-slate-700 pr-2 tracking-wide">{cat}</span>
                    <div className="flex items-center gap-2 md:gap-4">
                      <button
                        disabled={!user || (display.votes[cat] || 0) <= 0 || votesRemaining === MAX_VOTES_PER_ADDRESS}
                        onClick={() => onVote(cat, -1)}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 active:scale-90 disabled:opacity-20 disabled:active:scale-100 transition-all shadow-sm"
                        aria-label="Remove vote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                      </button>
                      <div className="w-8 md:w-10 text-center">
                        <span className="text-sm md:text-base font-black text-slate-900">{display.votes[cat] || 0}</span>
                      </div>
                      <button
                        disabled={!user || votesRemaining <= 0}
                        onClick={() => onVote(cat, 1)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center text-white active:scale-90 disabled:opacity-30 disabled:active:scale-100 transition-all shadow-md ${CATEGORY_COLORS[cat]} border-transparent`}
                        aria-label="Add vote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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