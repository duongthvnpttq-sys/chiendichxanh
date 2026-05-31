
import { fetchFromSupabase, upsertToSupabase, deleteFromSupabase, supabase } from './dataService';
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
const DELETED_KEY = 'vnpt_deleted_notifications';
let lastSync = 0;
let isSyncing = false;
let channelInitialized = false;
let notificationChannel: any = null;

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

let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

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

  playNotificationSound() {
    try {
      const audioCtx = getAudioContext();
      
      const playBeep = (startTime: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, startTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1760, startTime + 0.1); // A6
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      };

      const now = audioCtx.currentTime;
      // Play 3 beeps to make it very noticeable like an alarm/bell
      playBeep(now);
      playBeep(now + 0.15);
      playBeep(now + 0.3);
      playBeep(now + 0.6); // Extra beep to make sure it's heard
      
    } catch (e) {
       console.error("Lỗi phát âm thanh:", e);
    }
  },

  showNativeNotification(title: string, body: string) {
    if (!("Notification" in window)) return;
    
    const options: NotificationOptions = { 
      body, 
      icon: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200, 100, 200], // Thêm rung (nếu thiết bị hỗ trợ)
      requireInteraction: true // Yêu cầu người dùng tương tác để tắt
    };

    if (Notification.permission === "granted") {
      new Notification(title, options);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, options);
        }
      });
    }
  },

  initializeRealtime() {
    if (channelInitialized) return;
    channelInitialized = true;
    
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    
    // Subscribe to realtime broadcasts for instant cross-device notifications without needing a table
    notificationChannel = supabase.channel('vnpt_notifications_channel');
    notificationChannel.on('broadcast', { event: 'new_notification' }, (payload) => {
      const incomingNotif = payload.payload as VNPTNotification;
      const user = authService.getCurrentUser();
      
      if (incomingNotif && (!incomingNotif.userId || incomingNotif.userId === 'all' || incomingNotif.userId === user?.uid)) {
         const local = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
         if (!local.some(n => n.id === incomingNotif.id)) {
            // Save locally without broadcasting back
            setLocal(STORAGE_KEY, [incomingNotif, ...local]);
            this.playNotificationSound();
            this.showNativeNotification(incomingNotif.title, incomingNotif.message);
            this.notify();
         }
      }
    });

    notificationChannel.on('broadcast', { event: 'update_notification' }, (payload) => {
      const updateData = payload.payload;
      if (updateData && updateData.id) {
         const local = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
         const existingIndex = local.findIndex(n => n.id === updateData.id);
         if (existingIndex !== -1 && local[existingIndex].read !== updateData.read) {
            local[existingIndex] = { ...local[existingIndex], ...updateData };
            setLocal(STORAGE_KEY, local);
            this.notify();
         }
      }
    });

    notificationChannel.on('broadcast', { event: 'delete_notification' }, (payload) => {
      const { id } = payload.payload;
      if (id) {
         const local = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
         if (local.some(n => n.id === id)) {
            setLocal(STORAGE_KEY, local.filter(n => n.id !== id));
            this.notify();
         }
      }
    });
    
    notificationChannel.subscribe();

    // Auto-sync notifications when waking up from background/screen off
    document.addEventListener("visibilitychange", () => {
       if (document.visibilityState === "visible") {
          lastSync = 0;
          this.getNotifications();
       }
    });
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
          if (dbData) {
             const local = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
             const deletedIds = getLocal<string[]>(DELETED_KEY, []);
             
             if (deletedIds.length > 0) {
               const stillInDb = dbData.filter(d => deletedIds.includes(d.id));
               if (stillInDb.length > 0) {
                 deleteFromSupabase('vnpt_notifications', 'notifications', 'id', stillInDb.map(x => x.id)).catch(()=>{});
               }
               dbData = dbData.filter(d => !deletedIds.includes(d.id));
             }

             const dbIds = new Set(dbData.map(d => d.id));
             // Keep local only if recently created and not deleted
             const oneHourAgo = Date.now() - 3600000;
             const localOnly = local.filter(l => !dbIds.has(l.id) && !deletedIds.includes(l.id) && new Date(l.timestamp).getTime() > oneHourAgo);
             
             // Upload localOnly if any are missing from DB
             if (localOnly.length > 0) {
                upsertToSupabase('vnpt_notifications', 'notifications', localOnly.map(n => ({
                  ...n,
                  actionUrl: n.actionUrl || null,
                  userId: n.userId || null
                }))).catch(()=>{});
             }

             // Check if there are brand new notifications from DB that we didn't have locally
             const localIds = new Set(local.map(l => l.id));
             const newFromDb = dbData.filter(d => !localIds.has(d.id) && !d.read && (!d.userId || d.userId === currentUserId || d.userId === 'all'));
             
             if (newFromDb.length > 0) {
               this.playNotificationSound();
               if (newFromDb.length === 1) {
                 this.showNativeNotification(newFromDb[0].title, newFromDb[0].message);
               } else {
                 this.showNativeNotification('Thông báo mới', `Bạn có ${newFromDb.length} thông báo mới`);
               }
             }

             const merged = [...dbData, ...localOnly];
             
             // Sort by timestamp desc to be clean
             merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
         if (notificationChannel && notificationChannel.state === 'joined') {
           notificationChannel.send({
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
    const updated = rawNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.saveNotifications(updated, false);
    
    try {
      if (notificationChannel && notificationChannel.state === 'joined') {
        notificationChannel.send({
          type: 'broadcast',
          event: 'update_notification',
          payload: { id, read: true }
        }).catch(() => {});
      }
    } catch (e) {}
  },

  markAllAsRead() {
    const rawNotifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    const updated = rawNotifications.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated, false);
    
    updated.forEach(n => {
      try {
        if (notificationChannel && notificationChannel.state === 'joined') {
          notificationChannel.send({
             type: 'broadcast',
             event: 'update_notification',
             payload: { id: n.id, read: true }
          }).catch(() => {});
        }
      } catch (e) {}
    });
  },

  deleteNotification(id: string) {
    const rawNotifications = getLocal<VNPTNotification[]>(STORAGE_KEY, []);
    this.saveNotifications(rawNotifications.filter(n => n.id !== id), false);
    
    // Track deleted
    const deletedIds = getLocal<string[]>(DELETED_KEY, []);
    if (!deletedIds.includes(id)) {
      setLocal(DELETED_KEY, [...deletedIds, id]);
    }
    deleteFromSupabase('vnpt_notifications', 'notifications', 'id', [id]).catch(() => {});
    
    try {
      if (notificationChannel && notificationChannel.state === 'joined') {
        notificationChannel.send({
          type: 'broadcast',
          event: 'delete_notification',
          payload: { id }
        }).catch(() => {});
      }
    } catch (e) {}
  },

  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  }
};
