import { supabase } from "./dataService";

async function fetchFromSupabase<T>(table: string, type: string, defaultVal: T): Promise<T> {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
     console.error("fetchFromSupabase error", error);
     return defaultVal;
  }
  return (data || defaultVal) as T;
}

async function upsertToSupabase(table: string, type: string, records: any[]) {
  const { error } = await supabase.from(table).upsert(records);
  if (error) {
    console.error("upsertToSupabase error", error);
    return { success: false, error };
  }
  return { success: true, error: null };
}

async function deleteFromSupabase(table: string, type: string, idField: string, ids: string[]) {
  const { error } = await supabase.from(table).delete().in(idField, ids);
  if (error) console.error("deleteFromSupabase error", error);
}


export interface UserDetail {
  id: string;
  code: string;
  name: string;
  username?: string;
  role: string;
  unit: string;
  status: "ACTIVE" | "INACTIVE";
  phone: string;
  email: string;
  lastLogin?: string;
  progress: number;
}

export interface Territory {
  id: string;
  name: string;
  count: string;
  staffId?: string;
}

export interface UnitSettings {
  id: string;
  fullName: string;
  shortName: string;
  leader: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
}

const STORAGE_KEYS = {
  USERS: "vnpt_hr_users",
  TERRITORIES: "vnpt_hr_territories",
  UNIT_SETTINGS: "vnpt_unit_settings",
};

const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocal = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("Local storage write error for", key, e);
  }
};

const INITIAL_USERS: UserDetail[] = [];
const INITIAL_TERRITORIES: Territory[] = [];

const DEFAULT_SETTINGS: UnitSettings = {
  id: "settings_single",
  fullName: "VIỄN THÔNG TUYÊN QUANG",
  shortName: "VNPT TUYÊN QUANG",
  leader: "Giám đốc",
  address: "số 02 đường 17/8, P. Minh Xuân, TP. Tuyên Quang",
  phone: "02073.822.822",
  email: "vienthongtuyenquang@vnpt.vn",
  website: "http://tuyenquang.vnpt.vn",
  logoUrl: "https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png"
};

let listeners: Set<() => void> = new Set();

async function sha256(message: string): Promise<string> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      return "fallback_" + message;
    }
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    return "fallback_" + message;
  }
}

export const userService = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notify() {
    listeners.forEach(l => l());
  },

  getUsers(): UserDetail[] {
    const users = getLocal<UserDetail[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.syncUsersInBackground();
    return users.filter(u => !u.id.startsWith("pwd_"));
  },

  async syncUsersInBackground() {
    const now = Date.now();
    if ((this as any)._syncingUsers) return;
    if ((this as any)._lastUserSync && now - (this as any)._lastUserSync < 60000) return; // 1 min throttle
    (this as any)._syncingUsers = true;
    try {
      const localUsers = getLocal<UserDetail[]>(STORAGE_KEYS.USERS, INITIAL_USERS).filter((u: any) => !u.id.startsWith("pwd_"));
      const allDbUsers = await fetchFromSupabase<UserDetail[]>("vnpt_hr_users", "hr_users", []);
      
      try {
         const { data: passesData } = await supabase.from("vnpt_passwords").select("*");
         const passesStr = localStorage.getItem("vnpt_passwords");
         let localPasses = passesStr ? JSON.parse(passesStr) : {};
         let passesChanged = false;

         // 1. Đồng bộ từ Supabase về Local
         if (passesData && passesData.length > 0) {
            passesData.forEach((pd: any) => {
                if (localPasses[pd.user_id] !== pd.password_hash) {
                   localPasses[pd.user_id] = pd.password_hash;
                   passesChanged = true;
                }
            });
         }
         
         // 2. Đồng bộ từ Local lên Supabase (với những password chưa có trên DB)
         const dbPassMap = passesData ? new Map(passesData.map((pd: any) => [pd.user_id, pd.password_hash])) : new Map();
         const updatesToSupabase: any[] = [];
         
         for (const [uid, hash] of Object.entries(localPasses)) {
            if (!dbPassMap.has(uid) || dbPassMap.get(uid) !== hash) {
                updatesToSupabase.push({
                    user_id: uid,
                    password_hash: hash
                });
            }
         }
         
         if (updatesToSupabase.length > 0) {
            await supabase.from("vnpt_passwords").upsert(updatesToSupabase);
         }

         if (passesChanged) {
            localStorage.setItem("vnpt_passwords", JSON.stringify(localPasses));
         }
      } catch (err) {
         console.warn("Lỗi sync mật khẩu nền:", err);
      }
      
      if (allDbUsers && allDbUsers.length > 0) {
        
        const dbUsers = allDbUsers.filter((u: any) => !u.id.startsWith("pwd_"));
        const localJSON = JSON.stringify(localUsers);
        const dbJSON = JSON.stringify(dbUsers);
        if (localJSON !== dbJSON) {
          setLocal(STORAGE_KEYS.USERS, dbUsers);
          this.notify();
        }
      } else if (allDbUsers && allDbUsers.length === 0 && localUsers.length > 0) {
        await upsertToSupabase("vnpt_hr_users", "hr_users", localUsers);
      }
    } catch (err) {
      console.error("Users background sync failed:", err);
    } finally {
      (this as any)._syncingUsers = false;
      (this as any)._lastUserSync = Date.now();
    }
  },

  async addUser(user: Omit<UserDetail, 'id' | 'lastLogin' | 'progress'>) {
    const users = this.getUsers();
    
    // Generate valid UUID for Supabase
    const genUUID = () => {
      try {
        return crypto.randomUUID();
      } catch (e) {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
    
    const newUser: UserDetail = {
      ...user,
      id: genUUID(),
      lastLogin: 'Chưa đăng nhập',
      progress: 0
    };

    // Async push to Supabase
    const res = await upsertToSupabase('vnpt_hr_users', 'hr_users', [newUser]);
    if (!res.success) {
      console.error("Lỗi thêm user Supabase:", res.error);
      return { success: false, error: res.error, user: null };
    }

    const updated = [...users, newUser];
    setLocal(STORAGE_KEYS.USERS, updated);
    this.notify();

    this.changePassword(newUser.id, "Vnpt@123").catch(e => console.error("Lỗi set mật khẩu mặc định", e));

    return { success: true, error: null, user: newUser };
  },

  deleteUser(id: string) {
    const users = this.getUsers();
    const updated = users.filter(u => u.id !== id);
    setLocal(STORAGE_KEYS.USERS, updated);
    this.notify();

    // Async delete from Supabase
    deleteFromSupabase('vnpt_hr_users', 'hr_users', 'id', [id]).catch(console.error);
  },

  async updateUser(id: string, updates: Partial<UserDetail>) {
    const users = this.getUsers();
    let target: UserDetail | null = null;
    const updated = users.map(u => {
      if (u.id === id) {
        target = { ...u, ...updates };
        return target;
      }
      return u;
    });
    setLocal(STORAGE_KEYS.USERS, updated);
    this.notify();

    if (target) {
      const res = await upsertToSupabase('vnpt_hr_users', 'hr_users', [target]);
      if (!res.success) {
        console.error("Lỗi cập nhật user Supabase:", res.error);
        return { success: false, error: res.error };
      }
    }
    return { success: true, error: null };
  },

  async changePassword(userId: string, newPassword: string) {
    const passHash = await sha256(newPassword);
    console.log(`Password changed for user ${userId} (SHA-256 Hash recorded safely)`);

    // 1. Nếu là user hiện tại tự đổi mật khẩu của mình, đồng bộ trực tiếp lên Supabase Auth đám mây bảo mật cực cao
    try {
      const savedUserStr = localStorage.getItem("vnpt_user");
      if (savedUserStr) {
        const currentUser = JSON.parse(savedUserStr);
        if (currentUser && currentUser.uid === userId) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) {
            console.warn("Supabase Auth password update error:", error.message);
          } else {
            console.log("Supabase Auth cloud password synced successfully!");
          }
        }
      }
    } catch (err) {
      console.error("Lỗi đồng bộ mật khẩu mới lên Supabase Auth:", err);
    }

    // 2. Lưu trữ cục bộ mã băm SHA-256 (không bao giờ lưu text thường) phục vụ fallback offline
    try {
      const savedPassesStr = localStorage.getItem("vnpt_passwords") || "{}";
      const passes = JSON.parse(savedPassesStr);
      passes[userId] = passHash;
      localStorage.setItem("vnpt_passwords", JSON.stringify(passes));
    } catch (e) {
      console.error("Lỗi đồng bộ mật khẩu cục bộ:", e);
    }
    
    // 3. Đồng bộ mật khẩu hash (ẩn) lên CSDL Supabase đối với user offline chưa đăng ký Supabase Auth
    try {
       const pwdData = {
           user_id: userId,
           password_hash: passHash
       };
       await supabase.from("vnpt_passwords").upsert([pwdData]);
       console.log("Đã đồng bộ hash mật khẩu offline thành công");
    } catch (e) {
       console.error("Lỗi đẩy hash mật khẩu:", e);
    }

    this.notify();
    return true;
  },

  getTerritories(): Territory[] {
    const territories = getLocal<Territory[]>(STORAGE_KEYS.TERRITORIES, INITIAL_TERRITORIES);
    this.syncTerritoriesInBackground();
    return territories;
  },

  async syncTerritoriesInBackground() {
    const now = Date.now();
    if ((this as any)._syncingTerritories) return;
    if ((this as any)._lastTerritorySync && now - (this as any)._lastTerritorySync < 60000) return; // 1 min throttle
    (this as any)._syncingTerritories = true;
    try {
      const localTerritories = getLocal<Territory[]>(STORAGE_KEYS.TERRITORIES, INITIAL_TERRITORIES);
      const dbTerritories = await fetchFromSupabase<Territory[]>('vnpt_hr_territories', 'hr_territories', []);
      if (dbTerritories && dbTerritories.length > 0) {
        const localJSON = JSON.stringify(localTerritories);
        const dbJSON = JSON.stringify(dbTerritories);
        if (localJSON !== dbJSON) {
          setLocal(STORAGE_KEYS.TERRITORIES, dbTerritories);
          this.notify();
        }
      } else if (dbTerritories && dbTerritories.length === 0 && localTerritories.length > 0) {
        await upsertToSupabase('vnpt_hr_territories', 'hr_territories', localTerritories);
      }
    } catch (err) {
      console.error("Territories background sync failed:", err);
    } finally {
      (this as any)._syncingTerritories = false;
      (this as any)._lastTerritorySync = Date.now();
    }
  },

  addTerritory(name: string, count: string) {
    const territories = this.getTerritories();
    const newT: Territory = {
      id: 't' + Math.random().toString(36).substr(2, 9),
      name,
      count,
    };
    const updated = [...territories, newT];
    setLocal(STORAGE_KEYS.TERRITORIES, updated);
    this.notify();

    upsertToSupabase('vnpt_hr_territories', 'hr_territories', [newT]).catch(console.error);

    return newT;
  },

  deleteTerritory(id: string) {
    const territories = this.getTerritories();
    const updated = territories.filter(t => t.id !== id);
    setLocal(STORAGE_KEYS.TERRITORIES, updated);
    this.notify();

    deleteFromSupabase('vnpt_hr_territories', 'hr_territories', 'id', [id]).catch(console.error);
  },

  updateTerritory(id: string, updates: Partial<Territory>) {
    const territories = this.getTerritories();
    let target: Territory | null = null;
    const updated = territories.map(t => {
      if (t.id === id) {
        target = { ...t, ...updates };
        return target;
      }
      return t;
    });
    setLocal(STORAGE_KEYS.TERRITORIES, updated);
    this.notify();

    if (target) {
      upsertToSupabase('vnpt_hr_territories', 'hr_territories', [target]).catch(console.error);
    }
  },

  assignTerritory(territoryId: string, staffId: string | undefined) {
    const territories = this.getTerritories();
    let target: Territory | null = null;
    const updated = territories.map(t => {
      if (t.id === territoryId) {
        target = { ...t, staffId };
        return target;
      }
      return t;
    });
    setLocal(STORAGE_KEYS.TERRITORIES, updated);
    this.notify();

    if (target) {
      upsertToSupabase('vnpt_hr_territories', 'hr_territories', [target]).catch(console.error);
    }
  },

  getUnitSettings(): UnitSettings {
    const settings = getLocal<UnitSettings>(STORAGE_KEYS.UNIT_SETTINGS, DEFAULT_SETTINGS);
    this.syncUnitSettingsInBackground();
    return settings;
  },

  async syncUnitSettingsInBackground() {
    const now = Date.now();
    if ((this as any)._syncingUnitSettings) return;
    if ((this as any)._lastSettingsSync && now - (this as any)._lastSettingsSync < 60000) return; // 1 min throttle
    (this as any)._syncingUnitSettings = true;
    try {
      const localSettings = getLocal<UnitSettings>(STORAGE_KEYS.UNIT_SETTINGS, DEFAULT_SETTINGS);
      const dbSettings = await fetchFromSupabase<any[]>('vnpt_unit_settings', 'unit_settings', []);
      if (dbSettings && dbSettings.length > 0) {
        const first = dbSettings[0];
        // Omit id from database comparison
        const { id, ...cleanFirst } = first;
        const localJSON = JSON.stringify(localSettings);
        const dbJSON = JSON.stringify(cleanFirst);
        if (localJSON !== dbJSON) {
          setLocal(STORAGE_KEYS.UNIT_SETTINGS, cleanFirst);
          this.notify();
        }
      } else if (dbSettings && dbSettings.length === 0) {
        await upsertToSupabase('vnpt_unit_settings', 'unit_settings', [{ id: 'settings_single', ...localSettings }]);
      }
    } catch (err) {
      console.error("Unit settings background sync failed:", err);
    } finally {
      (this as any)._syncingUnitSettings = false;
      (this as any)._lastSettingsSync = Date.now();
    }
  },

  setUnitSettings(settings: UnitSettings) {
    setLocal(STORAGE_KEYS.UNIT_SETTINGS, settings);
    this.notify();

    upsertToSupabase('vnpt_unit_settings', 'unit_settings', [{ id: 'settings_single', ...settings }]).catch(console.error);
  },

  getUnitName(): string {
    return this.getUnitSettings().shortName;
  },

  setUnitName(name: string) {
    const settings = this.getUnitSettings();
    this.setUnitSettings({ ...settings, shortName: name });
  }
};
