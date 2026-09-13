import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatDate';

// Polls periodically rather than using a websocket — simple and
// sufficient for a college project; the count/dropdown still feel
// live without needing a persistent connection.
const POLL_INTERVAL_MS = 30000;

const NotificationBell = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 8 });
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // Silent — the bell just won't update this cycle; not worth a toast.
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await notificationService.markAsRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(`/${role}/${n.link}`);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setOpen((o) => !o)} className="relative text-gray-500 hover:text-gray-700">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm hover:bg-gray-50 ${!n.isRead ? 'bg-primary-50/40' : ''}`}
                >
                  <p className={`font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatDateTime(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate(`/${role}/notifications`);
            }}
            className="block w-full border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-gray-50"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
