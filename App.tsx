import React, { useState, useEffect } from 'react';
import { ViewType, DisplaySubmission, User as AppUser, VotingCategory } from './types';
import { MAX_VOTES_PER_ADDRESS, BLUFF_PARK_CENTER } from './constants';
import MapView from './components/MapView';
import SubmissionForm from './components/SubmissionForm';
import DisplayDetails from './components/DisplayDetails';
import Leaderboard from './components/Leaderboard';
import Login from './components/Login';
import { dbService } from './services/db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('MAP');
  const [submissions, setSubmissions] = useState<DisplaySubmission[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<DisplaySubmission | null>(null);
  const [submissionToEdit, setSubmissionToEdit] = useState<DisplaySubmission | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      const storedUser = dbService.getCurrentUser();
      const storedSubs = await dbService.getSubmissions();
      setUser(storedUser);
      setSubmissions(storedSubs);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleVote = async (category: VotingCategory) => {
    if (!selectedDisplay || !user) return;
    
    try {
      // Fix: Cast result to any to access 'user' and 'sub' properties which are unknown due to untyped Promise in dbService.
      const result = await dbService.castVote(user.id, selectedDisplay.id, category) as any;
      if (result) {
        setUser({ ...result.user });
        const allSubs = await dbService.getSubmissions();
        setSubmissions(allSubs);
        setSelectedDisplay({ ...result.sub });
      } else {
        alert("No votes remaining for this house!");
      }
    } catch (e) {
      console.error("Voting failed:", e);
    }
  };

  const handleNewSubmission = async (data: any) => {
    if (!user) return;
    
    const newSub: Omit<DisplaySubmission, 'id'> = {
      userId: user.id,
      firstName: data.firstName || user.firstName,
      lastName: data.lastName || user.lastName,
      address: data.address,
      lat: BLUFF_PARK_CENTER.lat + (Math.random() - 0.5) * 0.015,
      lng: BLUFF_PARK_CENTER.lng + (Math.random() - 0.5) * 0.015,
      photos: data.photos.map((url: string, i: number) => ({
        id: `p${i}-${Date.now()}`,
        url,
        isFeatured: i === (data.featuredIndex || 0)
      })),
      votes: {} as any,
      totalVotes: 0,
      description: data.description
    };

    await dbService.saveSubmission(newSub);
    const allSubs = await dbService.getSubmissions();
    setSubmissions(allSubs);
    setCurrentView('MAP');
  };

  const handleUpdateSubmission = async (data: any) => {
    if (!submissionToEdit) return;
    
    const updates = {
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      description: data.description,
      photos: data.photos.map((url: string, i: number) => ({
        id: `p${i}-${Date.now()}`,
        url,
        isFeatured: i === (data.featuredIndex || 0)
      }))
    };

    await dbService.updateSubmission(submissionToEdit.id, updates);
    const allSubs = await dbService.getSubmissions();
    setSubmissions(allSubs);
    setCurrentView('PROFILE');
    setSubmissionToEdit(null);
  };

  const handleLogin = (email: string) => {
    const loggedInUser = dbService.login(email);
    setUser(loggedInUser);
    setCurrentView('SUBMIT'); // Redirect directly to submission page
  };

  const handleLogout = () => {
    dbService.logout();
    setUser(null);
    setCurrentView('MAP');
  };

  const handleNavClick = (view: ViewType) => {
    setSelectedDisplay(null);
    setCurrentView(view);
  };

  if (isLoading) {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[100]">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="festive-font text-3xl text-red-600 animate-pulse">Polishing the Ornaments...</div>
        </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'MAP': return <MapView submissions={submissions} onSelectDisplay={setSelectedDisplay} />;
      case 'SUBMIT': return user ? <SubmissionForm onCancel={() => setCurrentView('MAP')} onSubmit={handleNewSubmission} defaultData={{ firstName: user.firstName, lastName: user.lastName, address: user.address }} /> : <Login onLogin={handleLogin} />;
      case 'EDIT_SUBMISSION': return submissionToEdit && <SubmissionForm onCancel={() => setCurrentView('PROFILE')} onSubmit={handleUpdateSubmission} initialData={submissionToEdit} />;
      case 'LEADERBOARD': return <Leaderboard submissions={submissions} onSelectDisplay={setSelectedDisplay} />;
      case 'PROFILE': {
        if (!user) return <Login onLogin={handleLogin} />;
        const userSubmission = submissions.find(s => s.userId === user.id);
        const profileImageUrl = userSubmission?.photos.find(p => p.isFeatured)?.url || userSubmission?.photos[0]?.url;
        const totalVotesCast = Object.values(user.votesRemainingPerAddress).reduce((total: number, remaining) => total + (MAX_VOTES_PER_ADDRESS - remaining), 0);
        
        return (
          <div className="p-6 text-center pt-20 h-full overflow-y-auto pb-36 relative z-10 scrollbar-hide">
            <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center text-slate-400 overflow-hidden border-4 border-red-100 shadow-xl">
              {profileImageUrl ? <img src={profileImageUrl} alt={user.name} className="w-full h-full object-cover" /> : <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            </div>
            <h2 className="text-2xl font-bold mb-1 text-slate-800">{user.name}</h2>
            <p className="text-slate-500 mb-8 text-sm">{user.email}</p>
            
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white max-w-sm mx-auto mb-8">
              <div className="text-red-600 text-xs font-bold uppercase tracking-widest mb-1">Spirit Score</div>
              <div className="text-5xl font-black text-red-600 mb-1">✨ {totalVotesCast}</div>
              <div className="text-xs text-slate-500 font-medium">Holiday Cheer Distributed</div>
            </div>

            {userSubmission ? (
              <div className="flex flex-col gap-3 mb-12 px-2 max-w-sm mx-auto">
                 <button 
                  onClick={() => setSelectedDisplay(userSubmission)}
                  className="w-full bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transform hover:-translate-y-1 transition-all text-[10px] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Your Display
                </button>
                 <button 
                  onClick={() => { setSubmissionToEdit(userSubmission); setCurrentView('EDIT_SUBMISSION'); }}
                  className="w-full bg-white text-green-700 border-2 border-green-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-50 transform hover:-translate-y-1 transition-all text-[10px] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit Details
                </button>
              </div>
            ) : null}

            <button className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 transition-colors" onClick={handleLogout}>Log Out</button>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-md landscape:max-w-4xl mx-auto bg-transparent relative overflow-hidden">
      <header className="bg-white/90 backdrop-blur-lg px-6 py-4 flex justify-center items-center sticky top-0 z-40 border-b border-white shadow-sm">
        <h1 className="festive-font text-3xl text-red-600">Bluff Park <span className="text-green-600">Lights</span></h1>
      </header>

      <main className="flex-grow relative overflow-hidden z-10">
        {renderContent()}
      </main>

      {selectedDisplay && <DisplayDetails display={selectedDisplay} user={user} onClose={() => setSelectedDisplay(null)} onVote={handleVote} />}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-white px-6 py-2 flex justify-between items-center z-50 max-w-md landscape:max-w-4xl mx-auto pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavButton active={currentView === 'MAP'} onClick={() => handleNavClick('MAP')} label="Map" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l-5.908-1.97a.75.75 0 00-.472 0l-5.908 1.97a.75.75 0 01-.976-.711V6.51c0-.297.175-.568.445-.69l5.908-1.97a.75.75 0 01.472 0l5.908 1.97a.75.75 0 00.445.068l5.908-1.97a.75.75 0 01.976.711v12.479a.75.75 0 01-.445.69l-5.908 1.97a.75.75 0 01-.472 0z" /></svg>} />
        <NavButton active={currentView === 'SUBMIT'} onClick={() => handleNavClick('SUBMIT')} label="Submit" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} />
        <NavButton active={currentView === 'LEADERBOARD'} onClick={() => handleNavClick('LEADERBOARD')} label="Best" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>} />
        <NavButton active={currentView === 'PROFILE'} onClick={() => handleNavClick('PROFILE')} label="You" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>} />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{active: boolean; onClick: () => void; icon: React.ReactNode; label: string}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-all ${active ? 'text-red-600 scale-110' : 'text-slate-400'}`}>
    <div className={`p-1.5 rounded-2xl ${active ? 'bg-red-50 ring-1 ring-red-100' : ''}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;