
import React, { useState, useEffect } from 'react';
import { GameUpdate, Unit, StorageData, ContentItem } from './types';
import TabSystem from './components/TabSystem';
import UpdateContent from './components/UpdateContent';

const STORAGE_KEY = 'als_update_wiki_v1';
const ADMIN_PASSWORD = 'nova';

const createDefaultUpdate = (id: string, name: string): GameUpdate => ({
  id,
  name,
  units: [],
  contentItems: [],
  buffs: [],
  nerfs: [],
  qol: [],
  codes: [],
});

const App: React.FC = () => {
  const [updates, setUpdates] = useState<GameUpdate[]>([]);
  const [activeUpdateId, setActiveUpdateId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: StorageData = JSON.parse(saved);
        setUpdates(parsed.updates || []);
        setActiveUpdateId(parsed.activeUpdateId || '');
        setIsAdmin(parsed.isAdmin || false);
      } catch (e) {
        console.error("Failed to load data", e);
        resetState();
      }
    } else {
      resetState();
    }
    setIsInitialized(true);
  }, []);

  const resetState = () => {
    const initialUpdate = createDefaultUpdate('1', 'Update v1.0');
    setUpdates([initialUpdate]);
    setActiveUpdateId(initialUpdate.id);
  };

  useEffect(() => {
    if (isInitialized) {
      const data: StorageData = { updates, activeUpdateId, isAdmin };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [updates, activeUpdateId, isAdmin, isInitialized]);

  const toggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowPassModal(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPassModal(false);
      setPassInput('');
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  const activeUpdate = updates.find(u => u.id === activeUpdateId);

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen pb-24">
      <nav className="sticky top-0 z-50 glass border-b border-red-900/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="font-black text-xl text-white italic">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ALS <span className="text-red-500">UPDATE WIKI</span></h1>
            <p className="text-[10px] text-red-900/60 uppercase tracking-widest font-black">Official Database</p>
          </div>
        </div>

        <button 
          onClick={toggleAdmin}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            isAdmin 
              ? 'bg-red-600/15 text-red-400 border border-red-500/30' 
              : 'bg-white/5 text-slate-500 hover:text-white border border-white/10'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
          {isAdmin ? 'Admin Mode' : 'Admin Login'}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <TabSystem 
          updates={updates}
          activeUpdateId={activeUpdateId}
          isAdmin={isAdmin}
          onSelect={setActiveUpdateId}
          onAdd={() => {
            const newId = Date.now().toString();
            const newUpdate = createDefaultUpdate(newId, `Update ${updates.length + 1}`);
            setUpdates([...updates, newUpdate]);
            setActiveUpdateId(newId);
          }}
          onRename={(id, name) => setUpdates(prev => prev.map(u => u.id === id ? { ...u, name } : u))}
          onDelete={(id) => {
            if (updates.length <= 1) return;
            const filtered = updates.filter(u => u.id !== id);
            setUpdates(filtered);
            if (activeUpdateId === id) setActiveUpdateId(filtered[0].id);
          }}
        />

        <div key={activeUpdateId} className="animate-fade-in mt-10">
          {activeUpdate ? (
            <UpdateContent 
              update={activeUpdate} 
              isAdmin={isAdmin}
              onChange={(fields) => setUpdates(prev => prev.map(u => u.id === activeUpdateId ? { ...u, ...fields } : u))}
            />
          ) : (
            <div className="text-center py-32 text-slate-700 font-bold uppercase tracking-widest">
              Select update to view
            </div>
          )}
        </div>
      </main>

      {showPassModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="glass w-full max-w-sm rounded-[2.5rem] p-10 animate-fade-in border border-red-500/20">
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Security Protocol</h3>
            <p className="text-slate-500 text-sm mb-8">Verification required for administrative modification.</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input 
                autoFocus
                type="password"
                placeholder="Code Name"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className={`w-full bg-white/5 border rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-red-500 text-center font-bold ${passError ? 'border-red-500 animate-pulse' : 'border-white/10'}`}
              />
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setShowPassModal(false); setPassError(false); setPassInput(''); }}
                  className="flex-1 px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold text-sm transition-all"
                >
                  Abort
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/30"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
