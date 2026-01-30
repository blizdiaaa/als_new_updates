
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GameUpdate, Unit, ContentItem, CodeEntry } from '../types';
import UnitCard from './UnitCard';

interface UpdateContentProps {
  update: GameUpdate;
  isAdmin: boolean;
  onChange: (fields: Partial<GameUpdate>) => void;
}

type ListKey = 'contentItems' | 'buffs' | 'nerfs' | 'qol';

interface ItemBlockProps {
  item: ContentItem;
  listKey: ListKey;
  isAdmin: boolean;
  onUpdate: (listKey: ListKey, id: string, fields: Partial<ContentItem>) => void;
  onRemove: (listKey: ListKey, id: string) => void;
  accentColor?: string;
}

const ItemBlock: React.FC<ItemBlockProps> = ({ 
  item, 
  listKey, 
  isAdmin, 
  onUpdate, 
  onRemove, 
  accentColor = 'red' 
}) => (
  <div className={`glass-card roadmap-item rounded-2xl p-5 group animate-fade-in mb-4 border-l-4 border-${accentColor}-500 bg-gradient-to-r from-${accentColor}-500/5 to-transparent`}>
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <span className={`text-[9px] uppercase tracking-[0.2em] font-black text-${accentColor}-500 mb-1 block`}>
          {item.type}
        </span>
        {isAdmin ? (
          <input 
            className="text-lg font-black bg-transparent border-none outline-none w-full p-0 text-white placeholder:text-red-900/40"
            value={item.title}
            onChange={(e) => onUpdate(listKey, item.id, { title: e.target.value })}
            placeholder="Title..."
          />
        ) : (
          <h4 className="text-lg font-black tracking-tight uppercase">{item.title}</h4>
        )}
      </div>
      {isAdmin && (
        <button 
          onClick={() => onRemove(listKey, item.id)}
          className="p-1.5 text-red-900 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-400/5"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      )}
    </div>
    {isAdmin ? (
      <textarea 
        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-slate-300 min-h-[80px] outline-none placeholder:text-red-900/20 resize-none"
        value={item.description}
        onChange={(e) => onUpdate(listKey, item.id, { description: e.target.value })}
        placeholder="Details..."
      />
    ) : (
      <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap pl-1 border-l border-white/5">
        {item.description || "No description provided."}
      </p>
    )}
  </div>
);

const UpdateContent: React.FC<UpdateContentProps> = ({ update, isAdmin, onChange }) => {
  const [showRoadmapMenu, setShowRoadmapMenu] = useState(false);
  const [showQoLMenu, setShowQoLMenu] = useState(false);
  
  // Section visibility states
  const [showUnits, setShowUnits] = useState(true);
  const [showCodes, setShowCodes] = useState(true);
  const [showContent, setShowContent] = useState(true);
  const [showAdjustments, setShowAdjustments] = useState(true);
  
  // Admin Tool States
  const [adminToolMode, setAdminToolMode] = useState<'scanner' | 'text' | 'formatter'>('scanner');
  const [rawLogInput, setRawLogInput] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUnit = () => {
    const newUnit: Unit = {
      id: Date.now().toString(),
      name: 'NEW UNIT',
      imageUrl: '', 
      status: 'Unevo'
    };
    onChange({ units: [...update.units, newUnit] });
    setShowUnits(true);
  };

  const handleAddItem = (listKey: ListKey, type: string) => {
    const newItem: ContentItem = {
      id: Date.now().toString(),
      type,
      title: `${type}`,
      description: '',
    };
    onChange({ [listKey]: [...(update[listKey] as ContentItem[]), newItem] });
    setShowRoadmapMenu(false);
    setShowQoLMenu(false);
    if (listKey === 'contentItems') setShowContent(true);
    if (['buffs', 'nerfs', 'qol'].includes(listKey)) setShowAdjustments(true);
  };

  const handleUpdateItem = (listKey: ListKey, id: string, fields: Partial<ContentItem>) => {
    const currentList = update[listKey] as ContentItem[];
    onChange({
      [listKey]: currentList.map(item => item.id === id ? { ...item, ...fields } : item)
    });
  };

  const handleRemoveItem = (listKey: ListKey, id: string) => {
    const currentList = update[listKey] as ContentItem[];
    onChange({ [listKey]: currentList.filter(item => item.id !== id) });
  };

  const extractUnits = () => {
    if (update.units.length === 0) {
      setExtractedText("**New Units**\n*No units found.*");
      return;
    }
    const header = "**New Units**\n";
    const body = update.units
      .map((u, i) => `**${i + 1}** - ${u.name}${u.status === 'Evo' ? ' (Evolved)' : ''}:`)
      .join('\n');
    setExtractedText(header + body);
  };

  const extractCodes = () => {
    const activeCodes = update.codes.filter(c => c.code.trim() !== '');
    if (activeCodes.length === 0) {
      setExtractedText("**New Codes**\n*No active codes found.*");
      return;
    }
    const header = "**New Codes**\n";
    const body = activeCodes
      .map((c, i) => `**${i + 1}** - ${c.code} : ${c.reward}`)
      .join('\n');
    setExtractedText(header + body);
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const processResponseData = (data: any) => {
    const newUnits: Unit[] = (data.units || []).map((u: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: u.name,
      status: (u.status === 'Evo' || u.status === 'Unevo') ? u.status : 'Unevo',
      imageUrl: ''
    }));

    const newCodes: CodeEntry[] = (data.codes || []).map((c: any) => ({
      code: String(c.code).toUpperCase(),
      reward: String(c.reward)
    }));

    const newContent: ContentItem[] = (data.contentItems || []).map((i: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      type: i.type || 'Stage',
      title: i.title,
      description: i.description
    }));

    const newQol: ContentItem[] = (data.qol || []).map((i: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      type: i.type || 'Optimization',
      title: i.title,
      description: i.description
    }));

    onChange({
      units: [...update.units, ...newUnits],
      codes: [...update.codes, ...newCodes],
      contentItems: [...update.contentItems, ...newContent],
      qol: [...update.qol, ...newQol]
    });
  };

  const extractionSchema = {
    type: Type.OBJECT,
    properties: {
      units: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['Evo', 'Unevo'] }
          }
        },
        description: "Brand NEW units being added to the game. NOT units being balanced or adjusted."
      },
      codes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            reward: { type: Type.STRING }
          }
        }
      },
      contentItems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      qol: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['Buff', 'Nerf', 'Optimization'] },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        },
        description: "Includes unit adjustments, rebalances, buffs, and nerfs. If an existing unit is changed, put it here."
      }
    }
  };

  const handleScanScreenshots = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProcessStatus('AI Deep Analysis In Progress...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const imageParts = await Promise.all(
        Array.from(files).map(async (file: File) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          return { inlineData: { data: base64, mimeType: file.type } };
        })
      );

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              ...imageParts,
              { text: "CRITICAL INSTRUCTION: Analyze these game update screenshots. Distinguish between brand NEW units (added to game) and REBALANCED units (existing units being adjusted). ONLY BRAND NEW UNITS go in the 'units' array. All rebalances/buffs/nerfs must go into 'qol'. Extract all 'New Codes' with rewards and 'New Content' (Stages, Raids, Events). Return strictly valid JSON." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: extractionSchema
        }
      });

      const data = JSON.parse(response.text || "{}");
      processResponseData(data);
    } catch (err) {
      console.error("Extraction failed", err);
      alert("AI failed to scan images. Check your network or API Key.");
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessTextLog = async () => {
    if (!rawLogInput.trim()) return;
    setIsProcessing(true);
    setProcessStatus('Neural Parsing Text Log...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: `CRITICAL INSTRUCTION: Analyze the following game update log text and split it into structured data. DISTINGUISH between BRAND NEW units (added to game) and REBALANCED units (existing units being adjusted). ONLY BRAND NEW UNITS go in the 'units' array. All rebalances/buffs/nerfs must go into 'qol'. Text: \n\n${rawLogInput}` }],
        config: {
          responseMimeType: "application/json",
          responseSchema: extractionSchema
        }
      });
      const data = JSON.parse(response.text || "{}");
      processResponseData(data);
      setRawLogInput('');
      alert("Log analyzed and categorized successfully.");
    } catch (err) {
      console.error("Text processing failed", err);
      alert("AI failed to process the text log.");
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
      
      {isProcessing && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in px-6 text-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-2 border-4 border-red-500/40 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Neural Link Active</h2>
          <p className="text-red-500 font-bold uppercase text-[10px] tracking-[0.5em] animate-pulse">{processStatus}</p>
        </div>
      )}

      {/* Left Area: Units & Codes (3 cols) */}
      <div className="lg:col-span-12 xl:col-span-3 space-y-8 order-2 xl:order-1">
        
        {/* New Units Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-red-900/20 pb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowUnits(!showUnits)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 transition-all duration-300 ${showUnits ? 'rotate-90' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight">New Units</h2>
                <p className="text-red-900/60 text-[10px] font-bold uppercase tracking-widest leading-none">Character Registry</p>
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={handleAddUnit}
                className="w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded-xl text-white transition-all shadow-lg shadow-red-500/20 active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              </button>
            )}
          </div>
          
          <div className={`transition-all duration-500 ease-in-out origin-top ${showUnits ? 'opacity-100 scale-100 h-auto visible' : 'opacity-0 scale-95 h-0 invisible overflow-hidden'}`}>
            <div className="flex flex-col gap-2">
              {update.units.map(unit => (
                <UnitCard 
                  key={unit.id}
                  unit={unit}
                  isAdmin={isAdmin}
                  onUpdate={(fields) => onChange({ units: update.units.map(u => u.id === unit.id ? { ...u, ...fields } : u) })}
                  onRemove={() => onChange({ units: update.units.filter(u => u.id !== unit.id) })}
                />
              ))}
              {update.units.length === 0 && (
                <div className="py-12 text-center rounded-3xl border-2 border-dashed border-red-900/10 text-red-950 uppercase font-black text-[10px] tracking-widest">
                  Registry Empty
                </div>
              )}
            </div>
          </div>
        </section>

        {/* New Codes Section */}
        <section className="glass rounded-[2rem] p-8 border border-red-500/10">
          <div className="flex justify-between items-center mb-6 border-b border-red-900/20 pb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowCodes(!showCodes)}
                className={`w-6 h-6 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 transition-all duration-300 ${showCodes ? 'rotate-90' : ''}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <h3 className="text-lg font-black uppercase tracking-tighter">New Codes</h3>
            </div>
            {isAdmin && (
              <button onClick={() => { onChange({ codes: [...update.codes, { code: '', reward: '' }] }); setShowCodes(true); }} className="text-red-500 hover:scale-110 transition-transform">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              </button>
            )}
          </div>
          
          <div className={`transition-all duration-500 ease-in-out origin-top ${showCodes ? 'opacity-100 h-auto visible' : 'opacity-0 h-0 invisible overflow-hidden'}`}>
            <div className="space-y-4">
              {update.codes.map((codeEntry, index) => (
                <div key={index} className="space-y-2 animate-fade-in pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-[8px] uppercase font-black text-red-900/40 ml-2">Code</p>
                      <input 
                        readOnly={!isAdmin}
                        type="text"
                        value={codeEntry.code}
                        onChange={(e) => {
                          const next = [...update.codes];
                          next[index] = { ...next[index], code: e.target.value.toUpperCase() };
                          onChange({ codes: next });
                        }}
                        className="w-full bg-red-950/20 border border-red-500/10 rounded-xl px-4 py-2 text-[10px] font-mono font-bold text-red-400 outline-none focus:border-red-500/40"
                        placeholder="CODE_NAME"
                      />
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => onChange({ codes: update.codes.filter((_, i) => i !== index) })} 
                        className="mt-5 self-start text-red-900 hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase font-black text-red-900/40 ml-2">Reward</p>
                    <input 
                      readOnly={!isAdmin}
                      type="text"
                      value={codeEntry.reward}
                      onChange={(e) => {
                        const next = [...update.codes];
                        next[index] = { ...next[index], reward: e.target.value };
                        onChange({ codes: next });
                      }}
                      className="w-full bg-red-950/20 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-300 outline-none focus:border-red-500/40"
                      placeholder="REWARD"
                    />
                  </div>
                </div>
              ))}
              {update.codes.length === 0 && (
                <p className="text-center text-red-900/40 text-[9px] font-black uppercase tracking-widest py-4">No Active Codes</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Center Area: New Content (5 cols) */}
      <div className="lg:col-span-12 xl:col-span-5 space-y-8 order-1 xl:order-2">
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-red-900/20 pb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowContent(!showContent)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 transition-all duration-300 ${showContent ? 'rotate-90' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">New Content</h2>
                <p className="text-red-900/60 text-[10px] font-bold uppercase tracking-widest mt-1">Operational Area</p>
              </div>
            </div>
            {isAdmin && (
              <div className="relative">
                <button 
                  onClick={() => setShowRoadmapMenu(!showRoadmapMenu)}
                  className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-xl text-red-400 font-black text-xs transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  Add Entry
                </button>
                {showRoadmapMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 border border-red-500/20 shadow-2xl z-20">
                    {['Stage', 'Event', 'Raid', 'Mode', 'Special'].map(type => (
                      <button 
                        key={type}
                        onClick={() => handleAddItem('contentItems', type)}
                        className="w-full text-left px-4 py-3 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`transition-all duration-500 ease-in-out origin-top ${showContent ? 'opacity-100 h-auto visible' : 'opacity-0 h-0 invisible overflow-hidden'}`}>
            <div className="space-y-4">
              {update.contentItems.map(item => (
                <ItemBlock 
                  key={item.id} 
                  item={item} 
                  listKey="contentItems" 
                  isAdmin={isAdmin}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                />
              ))}
              {update.contentItems.length === 0 && (
                <div className="py-24 text-center glass rounded-3xl border border-dashed border-red-900/10 text-red-950 font-black uppercase tracking-[0.3em] text-[10px]">
                  No Operations Logged
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Right Area: System Adjustments (4 cols) */}
      <div className="lg:col-span-12 xl:col-span-4 space-y-10 order-3">
        <section className="glass rounded-[2.5rem] p-10 space-y-8 border border-red-900/10">
          <div className="flex justify-between items-center border-b border-red-900/20 pb-4">
             <div className="flex items-center gap-3">
               <button 
                  onClick={() => setShowAdjustments(!showAdjustments)}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-500 transition-all duration-300 ${showAdjustments ? 'rotate-90' : ''}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </button>
                <h3 className="text-xl font-black uppercase tracking-tighter">System Adjustments</h3>
             </div>
             {isAdmin && (
               <div className="relative">
                 <button 
                   onClick={() => setShowQoLMenu(!showQoLMenu)}
                   className="p-2 text-red-500 hover:rotate-90 transition-transform"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                 </button>
                 {showQoLMenu && (
                   <div className="absolute right-0 mt-2 w-48 glass rounded-2xl p-2 border border-red-500/20 shadow-2xl z-20">
                     <button onClick={() => handleAddItem('qol', 'Buff')} className="w-full text-left px-4 py-2 hover:bg-green-600/20 hover:text-green-400 rounded-xl text-[10px] font-black uppercase mb-1">Add Buff</button>
                     <button onClick={() => handleAddItem('qol', 'Nerf')} className="w-full text-left px-4 py-2 hover:bg-red-600/20 hover:text-red-400 rounded-xl text-[10px] font-black uppercase mb-1">Add Nerf</button>
                     <button onClick={() => handleAddItem('qol', 'Optimization')} className="w-full text-left px-4 py-2 hover:bg-blue-600/20 hover:text-blue-400 rounded-xl text-[10px] font-black uppercase">Add QoL</button>
                   </div>
                 )}
               </div>
             )}
          </div>

          <div className={`transition-all duration-500 ease-in-out origin-top ${showAdjustments ? 'opacity-100 h-auto visible' : 'opacity-0 h-0 invisible overflow-hidden'}`}>
            <div className="space-y-4">
              {update.qol.map(item => {
                  let color = 'blue';
                  if(item.type === 'Buff') color = 'green';
                  if(item.type === 'Nerf') color = 'red';
                  return (
                      <ItemBlock 
                          key={item.id} 
                          item={item} 
                          listKey="qol" 
                          accentColor={color}
                          isAdmin={isAdmin}
                          onUpdate={handleUpdateItem}
                          onRemove={handleRemoveItem}
                      />
                  );
              })}
              {update.qol.length === 0 && (
                <div className="py-24 text-center border border-dashed border-red-900/10 rounded-3xl text-red-950 font-black uppercase tracking-[0.3em] text-[10px]">
                  No Active Rebalances
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ADMIN EXTRACT TOOLS */}
        {isAdmin && (
          <section className="glass rounded-[2.5rem] p-10 space-y-6 border border-red-900/10">
            <div className="border-b border-red-900/20 pb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 <h3 className="text-xl font-black uppercase tracking-tighter">Extract Update Log</h3>
              </div>
              
              <div className="mt-4">
                 <p className="text-red-900/40 text-[8px] font-black uppercase tracking-[0.2em] mb-2">Select Extraction Method</p>
                 <select 
                   value={adminToolMode}
                   onChange={(e) => setAdminToolMode(e.target.value as any)}
                   className="w-full bg-red-950/20 border border-red-500/20 rounded-xl px-4 py-3 text-[10px] font-black text-red-400 uppercase tracking-widest outline-none focus:border-red-500/50"
                 >
                   <option value="scanner">AI Screenshot Scanner</option>
                   <option value="text">Update Log (Text)</option>
                   <option value="formatter">Data Exporter</option>
                 </select>
              </div>
            </div>

            <div className="space-y-4 animate-fade-in">
              {adminToolMode === 'scanner' && (
                <div className="space-y-4">
                   <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                     Automated OCR processing of update screenshots. Strictly separates new units from rebalances.
                   </p>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full py-8 border-2 border-dashed border-red-500/20 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-red-500/5 transition-all group"
                   >
                      <svg className="w-8 h-8 text-red-900 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-900 group-hover:text-red-500">Scan Log Screenshots</span>
                   </button>
                   <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleScanScreenshots} className="hidden" />
                </div>
              )}

              {adminToolMode === 'text' && (
                <div className="space-y-4">
                   <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                     Paste raw patch notes. Neural processor will split data into Wiki-ready entries.
                   </p>
                   <textarea 
                     value={rawLogInput}
                     onChange={(e) => setRawLogInput(e.target.value)}
                     placeholder="PASTE RAW LOG DATA..."
                     className="w-full h-48 bg-red-950/20 border border-red-500/20 rounded-2xl p-4 text-[11px] font-medium text-red-100 outline-none resize-none no-scrollbar placeholder:text-red-900/30"
                   />
                   <button 
                     onClick={handleProcessTextLog}
                     disabled={!rawLogInput.trim() || isProcessing}
                     className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 disabled:opacity-30"
                   >
                     Split & Input Log
                   </button>
                </div>
              )}

              {adminToolMode === 'formatter' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button onClick={extractUnits} className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">Format Units</button>
                    <button onClick={extractCodes} className="flex-1 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest">Format Codes</button>
                  </div>
                  {extractedText && (
                    <div className="relative group animate-fade-in">
                      <textarea readOnly value={extractedText} className="w-full h-40 bg-red-950/30 border border-red-500/20 rounded-2xl p-4 text-[12px] text-red-100 font-medium outline-none resize-none" />
                      <button onClick={copyToClipboard} className={`absolute bottom-3 right-3 px-4 py-2 rounded-lg font-black text-[9px] uppercase transition-all shadow-xl ${copyFeedback ? 'bg-green-600' : 'bg-red-600'}`}>
                        {copyFeedback ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default UpdateContent;
