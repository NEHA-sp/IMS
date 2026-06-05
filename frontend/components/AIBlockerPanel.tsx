'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface KBEntry {
  id: number;
  question: string;
}

export interface AISuggestion {
  id: number;
  blocker_id: number;
  suggestion: string;
  confidence: number;
  feedback: 'pending' | 'helpful' | 'not_helpful';
  escalated: boolean;
  kbEntriesUsed?: KBEntry[];
}

interface AIBlockerPanelProps {
  suggestion: AISuggestion | null;
  loading: boolean;
  blockerId: number;
  onResolved: () => void;
}

export default function AIBlockerPanel({ suggestion, loading, blockerId, onResolved }: AIBlockerPanelProps) {
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'helpful' | 'not_helpful'>('idle');

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse my-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20"></div>
            <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
        </div>
        <div className="space-y-2 py-2">
          <div className="h-3 w-full bg-slate-200 rounded-md"></div>
          <div className="h-3 w-11/12 bg-slate-200 rounded-md"></div>
          <div className="h-3 w-4/5 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-8 w-full bg-slate-250 rounded-xl"></div>
      </div>
    );
  }

  if (!suggestion) return null;

  const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
    setFeedbackStatus('submitting');
    try {
      await api.post('/ai/feedback', {
        suggestionId: suggestion.id,
        blockerId: blockerId,
        feedback: type
      });
      setFeedbackStatus(type);
      if (type === 'helpful') {
        setTimeout(onResolved, 2000);
      }
    } catch (e) {
      console.error(e);
      setFeedbackStatus('idle');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400 text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'from-amber-500 to-yellow-400 text-amber-600 bg-amber-50';
    return 'from-rose-500 to-red-400 text-rose-600 bg-rose-50';
  };

  const confidenceColor = getConfidenceColor(suggestion.confidence);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden my-4 border-l-4 border-l-amber-500">
      
      {/* Background radial gold glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <h4 className="text-xs font-black uppercase text-amber-650 tracking-wider">AI Recommendation Solution</h4>
        </div>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${confidenceColor.split(' ')[2]} ${confidenceColor.split(' ')[3]}`}>
          {suggestion.confidence}% match score
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3.5">
        <div 
          className={`h-1.5 rounded-full bg-gradient-to-r ${confidenceColor.split(' ')[0]} ${confidenceColor.split(' ')[1]}`} 
          style={{ width: `${suggestion.confidence}%` }}
        ></div>
      </div>

      {/* Suggestion content */}
      {feedbackStatus === 'helpful' ? (
        <div className="text-center py-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
            <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-bold text-emerald-600">Resolved! Closing Blocker...</p>
          <p className="text-[10px] text-slate-450">This solution has been added to our shared Knowledge Base.</p>
        </div>
      ) : feedbackStatus === 'not_helpful' ? (
        <div className="text-center py-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-rose-600">Escalated to Mentor</p>
          <p className="text-[10px] text-slate-450">Your mentor has been notified with high priority to resolve this issue.</p>
        </div>
      ) : (
        <>
          <div className="text-slate-700 text-xs leading-relaxed font-sans bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4 whitespace-pre-line">
            {suggestion.suggestion}
          </div>

          {/* Sources references */}
          {suggestion.kbEntriesUsed && suggestion.kbEntriesUsed.length > 0 && (
            <div className="mb-4">
              <span className="block text-[9px] text-slate-450 font-bold uppercase tracking-wider mb-1.5">References & Citations</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.kbEntriesUsed.map((entry) => (
                  <span key={entry.id} className="text-[9px] bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-lg border border-slate-200/50 font-semibold">
                    FAQ #{entry.id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button 
              onClick={() => handleFeedback('helpful')}
              disabled={feedbackStatus === 'submitting'}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow shadow-amber-500/20 cursor-pointer"
            >
              Solved It ✓
            </button>
            <button 
              onClick={() => handleFeedback('not_helpful')}
              disabled={feedbackStatus === 'submitting'}
              className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
            >
              Still Stuck →
            </button>
          </div>
        </>
      )}

    </div>
  );
}
