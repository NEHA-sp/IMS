'use client';

import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { api, User } from '@/lib/api';

interface Mentor {
  id: number;
  name: string;
  email: string;
}

export default function AdminInternsPage() {
  const [interns, setInterns] = useState<User[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ internId: number; text: string; error: boolean } | null>(null);

  const fetchCohortData = async () => {
    try {
      const internData = await api.get<User[]>('/interns');
      setInterns(internData);

      const mentorData = await api.get<Mentor[]>('/interns/mentors');
      setMentors(mentorData);
    } catch (err) {
      console.error('Failed to load cohort and mentor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohortData();
  }, []);

  const handleAssignMentor = async (internId: number, mentorId: number | '') => {
    setAssigningId(internId);
    setStatusMsg(null);
    try {
      await api.post(`/interns/${internId}/assign-mentor`, { mentorId: mentorId === '' ? null : mentorId });
      setInterns(interns.map(i => i.id === internId ? { ...i, mentor_id: mentorId === '' ? null : mentorId } : i));
      
      const assignedMentor = mentors.find(m => m.id === mentorId);
      setStatusMsg({
        internId,
        text: mentorId === '' ? 'Mentor unassigned successfully!' : `Assigned to ${assignedMentor?.name} successfully!`,
        error: false
      });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to assign mentor:', err);
      setStatusMsg({
        internId,
        text: err.message || 'Failed to update mentor assignment.',
        error: true
      });
    } finally {
      setAssigningId(null);
    }
  };

  const filteredInterns = interns.filter((i) => {
    const query = searchQuery.toLowerCase();
    return (
      i.name.toLowerCase().includes(query) || 
      i.email.toLowerCase().includes(query) || 
      (i.batch_name || '').toLowerCase().includes(query)
    );
  });

  return (
    <MobileLayout role="admin">
      <div className="space-y-5 max-w-4xl">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Cohort Enrollment & Mentorship</h1>
          <p className="text-xs text-slate-500 font-semibold">Oversee onboarded UPSC aspirants and pair them with dynamic institute mentors.</p>
        </div>

        {/* Search */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search interns by name, email, cohort batch..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Intern list */}
        {loading ? (
          <div className="text-center py-10">
            <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredInterns.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs shadow-sm">
                No onboarded UPSC interns match your search parameters.
              </div>
            ) : (
              filteredInterns.map((i) => (
                <div key={i.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:shadow-md">
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">{i.name}</span>
                      <span className="block text-[10px] text-slate-450 font-semibold">{i.email}</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-full font-black border border-slate-200 uppercase">
                      {i.batch_name || 'UPSC CSE Cohort'}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Assigned Cohort Mentor Guidance
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={i.mentor_id || ''}
                        disabled={assigningId === i.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleAssignMentor(i.id, val === '' ? '' : parseInt(val));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                      >
                        <option value="">-- No Mentor Assigned (Self-Study) --</option>
                        {mentors.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                        ))}
                      </select>
                    </div>

                    {statusMsg && statusMsg.internId === i.id && (
                      <div className={`text-[10px] font-black uppercase mt-1 animate-fadeIn ${
                        statusMsg.error ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {statusMsg.error ? '❌ ' : '✓ '} {statusMsg.text}
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

      </div>
    </MobileLayout>
  );
}
