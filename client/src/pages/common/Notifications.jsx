import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';

import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/formatDate';

const typeLabel = {
  assignment_new: 'Assignment',
  assignment_graded: 'Grade',
  test_new: 'Test',
  announcement_new: 'Announcement',
  result_published: 'Results',
  material_new: 'Material',
};

const Notifications = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      await notificationService.markAsRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) navigate(`/${role}/${n.link}`);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  if (loading) return <LoadingState message="Loading notifications…" />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={unreadCount > 0 && <Button variant="secondary" onClick={handleMarkAllRead}>Mark all read</Button>}
      />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" message="You'll see updates about assignments, tests, grades, and more here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3.5 text-left last:border-b-0 hover:bg-gray-50 ${
                !n.isRead ? 'bg-primary-50/30' : ''
              }`}
            >
              <div className={`mt-0.5 rounded-lg p-2 ${!n.isRead ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bell size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">{typeLabel[n.type] || n.type}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
