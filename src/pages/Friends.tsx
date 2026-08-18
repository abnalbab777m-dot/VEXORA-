import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, UserCheck, UserX, Search, Swords, Clock, AlertCircle } from 'lucide-react';

export function Friends() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchFriends = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        fetch('/api/friends'),
        fetch('/api/friends/requests')
      ]);
      const fData = await fRes.json();
      const rData = await rRes.json();
      if (fRes.ok) setFriends(fData.data || []);
      if (rRes.ok) setRequests(rData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUsername: searchUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to send request');
      setActionMessage({ type: 'success', text: 'Friend request sent!' });
      setSearchUsername('');
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleRespond = async (senderId: string, accept: boolean) => {
    try {
      const res = await fetch('/api/friends/requests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, accept }),
      });
      if (res.ok) fetchFriends();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      const res = await fetch(`/api/friends/${friendId}`, { method: 'DELETE' });
      if (res.ok) fetchFriends();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading friends...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>

      {actionMessage && (
        <div className={`p-4 rounded-lg mb-8 flex items-center gap-3 ${actionMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <AlertCircle className="w-5 h-5" />
          {actionMessage.text}
        </div>
      )}

      <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#6C5CE7]" />
          Add Friend
        </h2>
        <form onSubmit={handleSendRequest} className="flex gap-4">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 bg-[#0A0F1C] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#6C5CE7]"
          />
          <button type="submit" className="bg-[#6C5CE7] hover:bg-[#5a4cd1] px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Search & Add
          </button>
        </form>
      </div>

      {requests.length > 0 && (
        <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-500">
            <Clock className="w-5 h-5" />
            Friend Requests ({requests.length})
          </h2>
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-[#0A0F1C] rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
                    {req.username[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-lg">{req.username}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleRespond(req.id, true)} className="bg-green-500/20 hover:bg-green-500/30 text-green-400 p-2 rounded-lg transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleRespond(req.id, false)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors">
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5">
        <h2 className="text-xl font-bold mb-4">My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            You don't have any friends yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div key={friend.id} className="flex flex-col p-4 bg-[#0A0F1C] rounded-lg border border-white/5 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#131A2A] flex items-center justify-center font-bold text-xl border border-white/10 relative">
                      {friend.username[0].toUpperCase()}
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0F1C] ${friend.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                    <div>
                      <span className="font-bold text-lg block">{friend.username}</span>
                      <span className="text-xs text-gray-400">{friend.status === 'ACTIVE' ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(friend.id)} className="text-gray-500 hover:text-red-400 transition-colors p-2" title="Remove Friend">
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
                {/* Future implementation: Invite directly to match */}
                {/* <button className="w-full bg-[#131A2A] hover:bg-white/5 text-[#00D4FF] py-2 rounded font-medium flex justify-center items-center gap-2 border border-white/5 transition-colors">
                  <Swords className="w-4 h-4" /> Challenge
                </button> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
