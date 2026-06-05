'use client';

import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { api, Blocker } from '@/lib/api';

export default function MentorBlockersPage() {
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const [customResolutions, setCustomResolutions] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchBlockers = async () => {
    try {
      const data = await api.get<Blocker[]>('/blockers');
      // Filter for open blockers
      setBlockers(data.filter(b => b.status === 'open'));
    } catch (err) {
      console.error('Failed to load blockers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockers();
  }, []);

  const handleResolveBlocker = async (blockerId: number, resolutionText: string) => {
    if (!resolutionText.trim()) return;
    setSubmittingId(blockerId);
    try {
      await api.patch(`/blockers/${blockerId}/resolve`, {
        resolution: resolutionText
      });
      // Remove resolved blocker from local list
      setBlockers(blockers.filter(b => b.id !== blockerId));
    } catch (err) {
      console.error('Failed to resolve blocker:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <MobileLayout role="mentor">
      <div className="space-y-5 max-w-4xl">
        
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Blocker Review Console</h1>
          <p className="text-xs text-slate-500 font-semibold">Review and clear active learning blockers in your cohort.</p>
        </div>

        {/* Blocker list */}
        <div className="space-y-4">
          {blockers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs shadow-sm">
              ✨ All clear! No active learning blockers reported in your cohort.
            </div>
          ) : (
            blockers.map((b) => {
              const customText = customResolutions[b.id] || '';
              return (
                <div key={b.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  
                  {/* Blocker Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">{b.intern_name}</span>
                      <span className="block text-[10px] text-amber-600 font-black uppercase mt-0.5">{b.blocker_type} Blocker</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      b.severity === 'critical' || b.severity === 'high' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {b.severity} severity
                    </span>
                  </div>

                  {/* Blocker Description */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Intern Blocker Details</span>
                    "{b.description}"
                  </div>

                  {/* AI Suggestion box (if logged) */}
                  {b.ai_confidence ? (
                    <div className="bg-amber-50/30 p-4 rounded-xl border border-dashed border-amber-300 text-xs text-slate-700 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">AI Automated Suggestion Recommendation</span>
                        <span className="text-[9px] text-amber-600 font-bold">Confidence Match: {b.ai_confidence}%</span>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed italic bg-white/80 p-3 rounded-lg border border-amber-100/50">
                        "Wait for design team mockups or request Plain Text PDF template from systems."
                      </p>

                      <button
                        onClick={() => handleResolveBlocker(b.id, `Resolved using recommended AI solution: Wait for design team mockups or use plain text templates.`)}
                        disabled={submittingId === b.id}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-white transition-colors text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow shadow-amber-200/50"
                      >
                        Accept & Apply AI Workaround Fix ✓
                      </button>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-400 font-bold bg-slate-50 py-2 px-3.5 rounded-xl border border-slate-100">
                      ℹ️ AI suggestions confidence was too low. Requires manual mentor override feedback.
                    </div>
                  )}

                  {/* Manual Override inputs */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">
                      Custom Resolution Feedback Guide
                    </label>
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomResolutions({ ...customResolutions, [b.id]: e.target.value })}
                      placeholder="Type step-by-step instructions or recommended source materials..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
                    />
                    
                    <button
                      onClick={() => handleResolveBlocker(b.id, customText)}
                      disabled={submittingId === b.id || !customText.trim()}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {submittingId === b.id ? 'Submitting...' : 'Resolve Blocker Override'}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </MobileLayout>
  );
}
