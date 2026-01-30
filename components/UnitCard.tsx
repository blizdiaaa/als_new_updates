
import React from 'react';
import { Unit } from '../types';

interface UnitCardProps {
  unit: Unit;
  isAdmin: boolean;
  onUpdate: (fields: Partial<Unit>) => void;
  onRemove: () => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, isAdmin, onUpdate, onRemove }) => {
  const isEvo = unit.status === 'Evo';

  return (
    <div className={`glass-card rounded-xl overflow-hidden flex items-center group/unit animate-fade-in border p-3 transition-all duration-300 ${
      isEvo 
        ? 'border-red-500/50 bg-red-600/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
        : 'border-white/5 bg-white/[0.02]'
    }`}>
      <div className="flex-1 flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full ${isEvo ? 'bg-red-500 animate-pulse' : 'bg-red-900/40'}`}></div>
        
        <div className="flex-1">
          {isAdmin ? (
            <input 
              type="text" 
              value={unit.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-transparent border-none text-white font-black text-xs focus:ring-0 outline-none placeholder:text-red-900/20 uppercase tracking-widest"
              placeholder="UNIT NAME"
            />
          ) : (
            <h5 className={`font-black text-xs uppercase tracking-widest transition-colors ${isEvo ? 'text-red-400' : 'text-slate-300'}`}>
              {unit.name}
            </h5>
          )}
          
          <div className="flex items-center gap-2 mt-0.5">
            {isAdmin ? (
              <select 
                value={unit.status || 'Unevo'}
                onChange={(e) => onUpdate({ status: e.target.value as 'Evo' | 'Unevo' })}
                className="bg-transparent text-red-500/60 text-[8px] font-black uppercase tracking-widest outline-none border-none p-0 cursor-pointer hover:text-red-500 transition-colors"
              >
                <option value="Unevo" className="bg-black text-white">Base</option>
                <option value="Evo" className="bg-black text-white">Evo</option>
              </select>
            ) : (
              <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${isEvo ? 'text-red-500' : 'text-red-900/60'}`}>
                {isEvo ? 'Evolved Form' : 'Base Form'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <button 
          onClick={onRemove}
          className="ml-2 p-1.5 rounded-lg text-red-900 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/unit:opacity-100"
          title="Remove Unit"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      )}
    </div>
  );
};

export default UnitCard;
