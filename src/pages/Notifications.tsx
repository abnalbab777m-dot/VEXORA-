import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = (notif: any) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.type === 'FRIEND_REQUEST') {
      navigate('/friends');
    } else if (notif.type === 'MATCH_INVITE') {
      try {
        const meta = JSON.parse(notif.metadata);
        navigate(`/matchmaking?gameId=${meta.gameId}&stakeId=${meta.stakeId}&inviteId=${meta.inviteId}`);
      } catch (e) {
        navigate('/games');
      }
    } else if (notif.type === 'DEPOSIT_APPROVED' || notif.type === 'DEPOSIT_REJECTED') {
      navigate('/wallet');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading notifications...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-[#6C5CE7]" />
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            You don't have any notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-xl border transition-colors cursor-pointer ${notif.read ? 'bg-[#0A0F1C] border-white/5' : 'bg-[#131A2A] border-[#6C5CE7]/50'}`}
              onClick={() => handleAction(notif)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${notif.read ? 'bg-white/5 text-gray-400' : 'bg-[#6C5CE7]/20 text-[#00D4FF]'}`}>
                    {notif.type === 'FRIEND_REQUEST' && <Bell className="w-5 h-5" />}
                    {notif.type === 'MATCH_INVITE' && <Bell className="w-5 h-5" />}
                    {notif.type.includes('DEPOSIT') && <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`font-bold ${notif.read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {!notif.read && (
                  <div className="w-3 h-3 rounded-full bg-[#00D4FF]" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
