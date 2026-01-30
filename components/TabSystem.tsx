
import React, { useState, useRef, useEffect } from 'react';
import { GameUpdate } from '../types';

interface TabSystemProps {
  updates: GameUpdate[];
  activeUpdateId: string;
  isAdmin: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const TabSystem: React.FC<TabSystemProps> = ({ updates, activeUpdateId, isAdmin, onSelect, onAdd, onRename, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (update: GameUpdate) => {
    if (!isAdmin) return;
    setEditingId(update.id);
    setEditValue(update.name);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar pb-3">
      {updates.map((update) => (
        <div 
          key={update.id}
          onClick={() => onSelect(update.id)}
          onDoubleClick={() => startEditing(update)}
          className={`group flex items-center h-14 px-8 rounded-2xl cursor-pointer transition-all duration-300 whitespace-nowrap border ${
            activeUpdateId === update.id 
              ? 'bg-red-600/10 border-red-500/40 text-red-500 shadow-[0_0_25px_rgba(239,68,68,0.15)]' 
              : 'border-white/5 text-slate-500 hover:bg-white/5 hover:border-white/10 hover:text-slate-300'
          }`}
        >
          {editingId === update.id ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="bg-transparent border-none outline-none font-black w-36 focus:ring-0 text-white uppercase tracking-tighter"
            />
          ) : (
            <span className={`font-black uppercase tracking-tighter text-sm ${activeUpdateId === update.id ? 'text-white' : ''}`}>
              {update.name}
            </span>
          )}

          {isAdmin && updates.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(update.id); }}
              className="ml-4 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all rounded-md hover:bg-red-400/10"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          )}
        </div>
      ))}
      
      {isAdmin && (
        <button 
          onClick={onAdd}
          className="w-14 h-14 flex items-center justify-center rounded-2xl border border-dashed border-red-900/40 text-red-900 hover:border-red-500 hover:text-red-500 transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </button>
      )}
    </div>
  );
};

export default TabSystem;
