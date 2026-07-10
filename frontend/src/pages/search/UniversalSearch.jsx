import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, Home, User, Bed, ArrowRight, CornerDownRight, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const UniversalSearch = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({ students: [], rooms: [], staff: [], complaints: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query.trim() !== '') {
      fetchSearchResults();
    }
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('aegis_token');
      const res = await axios.get(`${API_URL}/search`, {
        params: { q: query },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setResults(res.data.results);
      }
    } catch {
      toast.error('Search query execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <Search className="text-blue-600" size={22} /> Universal Search Engine
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
          Search results matching query keyword: <strong className="text-blue-600">"{query}"</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <User size={15} className="text-blue-655" /> Match Resident Students ({results.students?.length || 0})
            </h3>
            
            {results.students?.length > 0 ? (
              <div className="space-y-3.5">
                {results.students.map((student) => {
                  const activeAlloc = student.allocations?.find(a => a.status === 'Active');
                  return (
                    <div key={student.id} className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                      <div>
                        <span className="text-slate-800 dark:text-white font-bold block">{student.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{student.enrollmentNumber}</span>
                        
                        {activeAlloc && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 mt-2 font-semibold">
                            <CornerDownRight size={10} /> Allocated: Room {activeAlloc.room?.roomNumber} ({activeAlloc.room?.hostel?.name})
                          </span>
                        )}
                      </div>
                      <Link to={`/students/${student.id}`}>
                        <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1">
                          View Card <ArrowRight size={12} />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching resident students found.</p>
            )}
          </div>

          {/* Rooms Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <Home size={15} className="text-blue-655" /> Match Hostel Rooms ({results.rooms?.length || 0})
            </h3>

            {results.rooms?.length > 0 ? (
              <div className="space-y-3.5">
                {results.rooms.map((room) => {
                  return (
                    <div key={room.id} className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                      <div>
                        <span className="text-slate-800 dark:text-white font-bold block">Room {room.roomNumber} ({room.hostel?.name})</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{room.type} &middot; ₹{room.monthlyRent}/mo</span>
                      </div>
                      <Link to="/rooms">
                        <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1">
                          View Status <ArrowRight size={12} />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching rooms found.</p>
            )}
          </div>

          {/* Staff Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-blue-655" /> Match Staff Directory ({results.staff?.length || 0})
            </h3>
            
            {results.staff?.length > 0 ? (
              <div className="space-y-3.5">
                {results.staff.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-slate-800 dark:text-white font-bold block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{s.designation} &middot; {s.phone}</span>
                    </div>
                    <Link to="/staff">
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1">
                        View Directory <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching staff members found.</p>
            )}
          </div>

          {/* Complaints Results */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-blue-655" /> Match Support Tickets ({results.complaints?.length || 0})
            </h3>
            
            {results.complaints?.length > 0 ? (
              <div className="space-y-3.5">
                {results.complaints.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-slate-800 dark:text-white font-bold block">{c.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">By: {c.student?.name} &middot; Priority: {c.priority}</span>
                    </div>
                    <Link to="/complaints">
                      <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1">
                        Resolve Ticket <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic py-4">No matching support tickets found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
