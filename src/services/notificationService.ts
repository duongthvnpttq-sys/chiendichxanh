
import { fetchFromSupabase, upsertToSupabase, supabase } from './dataService';
import { authService } from './authService';

export interface VNPTNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'TASK' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  userId?: string;
}

const STORAGE_KEY = 'vnpt_notifications';
let lastSync = 0;
let isSyncing = false;
let channelInitialized = false;

const getLocal = <T>(key: string, def: T): T => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : def;
  } catch (e) {
    return def;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write failed in notificationService:', e);
  }
};

const INITIAL_NOTIFICATIONS: VNPTNotification[] = [];

let listeners: Set<() => void> = new Set();

export const notificationService = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    const interval = setInterval(() => {
      this.getNotifications();
    }, 2000);
    return () => {
      listeners.delete(callback);
      clearInterval(interval);
    }
  },

  notify() {
    listeners.forEach(l => l());
  },

  initializeRealtime() {
    if (channelInitialized) return;
    channelInitialized = true;
    
    // Subscribe to realtime broadcasts for instant cross-device notifications without needing a table
    const channel = supabase.channel('vnpt_notifications_channel');
    channel.on('broadcast', { event: 'new_notification' }, (payload) => {
      const incomingNotif = payload.payload as VNPTNotification;
      const user = authService.getCurrentUser();
      
      if (incomingNotif && (!incomingNotif.userId || incomingNotif.userId === 'all' || incomingNotif.userId === user?.uid)) {
         const local = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
         if (!local.some(n => n.id === incomingNotif.id)) {
            // Save locally without broadcasting back
            setLocal(STORAGE_KEY, [incomingNotif, ...local]);
            this.notify();
         }
      }
    }).subscribe();
  },

  getNotifications(): VNPTNotification[] {
    this.initializeRealtime();
    const user = authService.getCurrentUser();
    const currentUserId = user?.uid;
    
    // Auto sync background cache
    const now = Date.now();
    const SYNC_INTERVAL_MS = 2000;
    if (!isSyncing && now - lastSync > SYNC_INTERVAL_MS) { // sync background
      isSyncing = true;
      fetchFromSupabase<VNPTNotification[]>('vnpt_notifications', 'notifications', [])
        .then(dbData => {
          if (dbData && dbData.length > 0) {
             const local = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
             const merged = [...dbData];
             const dbIds = new Set(dbData.map(d => d.id));
             local.forEach(l => { if (!dbIds.has(l.id)) merged.push(l); });

             setLocal(STORAGE_KEY, merged);
             lastSync = Date.now();
             this.notify();
          }
        })
        .catch(err => {
            // Fail silently if table doesn't exist
            lastSync = Date.now();
        })
        .finally(() => {
          isSyncing = false;
        });
    }

    const notifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    
    // Filter by current user if they are logged in
    if (currentUserId && currentUserId !== 'u1') { // u1 is admin default
      return notifications.filter(n => !n.userId || n.userId === currentUserId || n.userId === 'all');
    }
    
    return notifications;
  },

  saveNotifications(notifications: VNPTNotification[], broadcast = true) {
    setLocal(STORAGE_KEY, notifications);
    
    // Async upload if user is signed in
    const normalized = notifications.map(n => ({
      ...n,
      actionUrl: n.actionUrl || null,
      userId: n.userId || null
    }));
    upsertToSupabase('vnpt_notifications', 'notifications', normalized).catch(() => {});
    
    // Broadcast via realtime channel if this is a new local creation
    if (broadcast && notifications.length > 0) {
       try {
         const channel = supabase.channel('vnpt_notifications_channel');
         if (channel && channel.state === 'joined') {
           channel.send({
             type: 'broadcast',
             event: 'new_notification',
             payload: notifications[0]
           }).catch(() => {});
         }
       } catch (e) {
         console.warn("Realtime broadcast skipped:", e);
       }
    }
    
    this.notify();
  },

  addNotification(notification: Omit<VNPTNotification, 'id' | 'timestamp' | 'read'>) {
    const rawNotifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    const newNotif: VNPTNotification = {
      ...notification,
      id: 'n' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    this.saveNotifications([newNotif, ...rawNotifications], true);
    return newNotif;
  },

  markAsRead(id: string) {
    const rawNotifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    this.saveNotifications(rawNotifications.map(n => n.id === id ? { ...n, read: true } : n), false);
  },

  markAllAsRead() {
    const rawNotifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    this.saveNotifications(rawNotifications.map(n => ({ ...n, read: true })), false);
  },

  deleteNotification(id: string) {
    const rawNotifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    this.saveNotifications(rawNotifications.filter(n => n.id !== id), false);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  }
};
