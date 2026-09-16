import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types/internship';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  FileText,
  UserCheck,
  Calendar
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await NotificationService.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.count);
      }
    } catch {
      // Quiet fail on network polling
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await NotificationService.getNotifications(unreadOnly, 25);
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch {
      // Quiet fail
    } finally {
      setIsLoading(false);
    }
  }, [user, unreadOnly]);

  // Initial load & periodic polling (every 30s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when opened or filter toggled
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Error handling
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Error handling
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await NotificationService.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Error handling
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    setIsOpen(false);

    // Contextual navigation based on role & entity type
    if (user?.role === 'STUDENT') {
      if (notification.related_entity_type === 'APPLICATION') {
        navigate('/dashboard/student/applications');
      } else {
        navigate('/dashboard/student');
      }
    } else if (user?.role === 'COMPANY') {
      if (notification.related_entity_type === 'APPLICATION') {
        navigate('/company/applications');
      } else {
        navigate('/company/internships');
      }
    } else if (user?.role === 'ADMIN') {
      if (notification.related_entity_type === 'APPLICATION') {
        navigate('/admin/applications');
      } else {
        navigate('/dashboard/admin');
      }
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('SELECTED') || type.includes('APPROVED')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (type.includes('INTERVIEW')) {
      return <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    if (type.includes('SHORTLISTED')) {
      return <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (type.includes('REJECTED') || type.includes('WITHDRAWN')) {
      return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (type.includes('APPLICATION')) {
      return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    return <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-notification-bell"
        type="button"
        onClick={handleToggle}
        className={`relative p-2 rounded border transition-colors cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
            : unreadCount > 0
            ? 'border-cyan-800/80 bg-slate-900 text-cyan-400 hover:border-cyan-600'
            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
        }`}
        title={`Notifications (${unreadCount} unread)`}
        aria-label="Open notifications menu"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span 
            id="notification-unread-count-badge"
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold text-white bg-rose-600 rounded-full border border-slate-900"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div 
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-sm bg-[#090d16] border border-cyan-900/80 shadow-2xl z-50 overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-[#060911]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setUnreadOnly((prev) => !prev)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  unreadOnly
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {unreadOnly ? 'Unread only' : 'All'}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-slate-400 space-y-1">
                <Clock className="w-4 h-4 animate-spin mx-auto text-cyan-400 mb-2" />
                <p>Retrieving notification log...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-slate-400 space-y-1 px-4">
                <Bell className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-slate-300 font-semibold">No notifications</p>
                <p className="text-[11px] text-slate-500">
                  {unreadOnly
                    ? 'All notifications have been reviewed.'
                    : 'System alerts and application updates will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  id={`notification-item-${item.id}`}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                    item.is_read
                      ? 'bg-[#090d16] hover:bg-slate-900/60 text-slate-300'
                      : 'bg-cyan-950/20 hover:bg-cyan-950/30 text-slate-100 border-l-2 border-cyan-400'
                  }`}
                >
                  <div className="pt-0.5">{getNotificationIcon(item.type)}</div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`font-mono text-xs truncate ${item.is_read ? 'text-slate-300' : 'font-bold text-cyan-200'}`}>
                        {item.title}
                      </h5>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                      {item.message}
                    </p>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                      title="Delete alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-800/80 bg-[#060911] text-center">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
              INTERNHUB DISCOVERY NETWORK
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
