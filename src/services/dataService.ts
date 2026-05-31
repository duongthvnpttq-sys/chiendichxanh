
let lastCustomersSync = 0;
let lastAssignmentsSync = 0;
let lastPotentialsSync = 0;
let lastCategoriesSync = 0;
let lastBatchesSync = 0;
const SYNC_INTERVAL = 30000; // 30 seconds for background sync (realtime handles immediate updates)

import { createClient } from "@supabase/supabase-js";
import { toast } from 'sonner';

const rawUrl = "https://zlhygscjdtkjybzuiijc.supabase.co/rest/v1/";
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, ""); 
const SUPABASE_KEY = "sb_publishable_ta6hxUqkalqiuANk737nSg_MWfYGB6q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  revenue?: number;
  services?: string[];
  region?: string;
  categoryId?: string;
  campaignId?: string;
  // New fields for distribution
  territory?: string;
  salesManager?: string;
  technicalManager?: string;
  subscriptionId?: string;
  addressDetail?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface Assignment {
  id?: string;
  customerId: string;
  staffId: string;
  campaignId: string;
  status: 'UNASSIGNED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SUCCESS' | 'FAILED' | 'LOCKED' | 'RESCHEDULED';
  assignedDate: any;
  deadline?: string;
  outcome?: string;
  notes?: string;
  checkInLocation?: { lat: number; lng: number; timestamp: string };
  images?: string[];
  managerNotes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  taskType?: string;
  assignedBy?: string;
}

const STORAGE_KEYS = {
  CUSTOMERS: 'vnpt_customers',
  ASSIGNMENTS: 'vnpt_assignments',
  BATCHES: 'vnpt_batches',
  CATEGORIES: 'vnpt_categories',
  POTENTIAL_CUSTOMERS: 'vnpt_potential_customers',
  DELETED_POTENTIALS: 'vnpt_deleted_potentials',
};

import { PROGRAM_CATEGORIES as DEFAULT_CATEGORIES, BATCHES as DEFAULT_BATCHES } from "../constants/campaignData";

export interface ProgramCategory {
  id: string;
  name: string;
  description: string;
  services: string[];
  createdAt?: string;
  createdBy?: string;
}

const INITIAL_CATEGORIES: ProgramCategory[] = DEFAULT_CATEGORIES;

export interface ImplementationBatch {
  id: string;
  programId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  createdAt?: string;
  createdBy?: string;
}

const INITIAL_BATCHES: ImplementationBatch[] = DEFAULT_BATCHES;

export interface PotentialCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  currentProvider?: string;
  paymentMethod?: string;
  previousBillingExpiration?: string;
  painPoints?: string;
  salesNotes?: string;
  staffId?: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED';
  createdAt: string;
  createdBy?: string;
}

const INITIAL_POTENTIAL_CUSTOMERS: PotentialCustomer[] = [];

let memoryCache: Record<string, any> = {};
const pendingWrites: Record<string, NodeJS.Timeout> = {};

const getLocal = <T>(key: string, def: T): T => {
  if (memoryCache[key]) return memoryCache[key];
  if (typeof localStorage === 'undefined') return def;
  try {
    const data = localStorage.getItem(key);
    const parsed = data ? JSON.parse(data) : def;
    memoryCache[key] = parsed;
    return parsed;
  } catch (e) {
    console.error("Local storage read error for", key, e);
    return def;
  }
};

const setLocal = (key: string, data: any) => {
  memoryCache[key] = data;
  if (typeof localStorage === 'undefined') return;
  
  if (pendingWrites[key]) clearTimeout(pendingWrites[key]);
  pendingWrites[key] = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
        console.warn("LocalStorage quota exceeded. Attempting to prune data...");
        if (key === STORAGE_KEYS.ASSIGNMENTS && Array.isArray(data)) {
          const pruned = data.slice(-500);
          memoryCache[key] = pruned;
          try {
            localStorage.setItem(key, JSON.stringify(pruned));
          } catch (innerE) {
            console.error("Failed even after pruning assignments:", innerE);
          }
        }
      } else {
        console.error("LocalStorage write failed:", e);
      }
    }
  }, 100);
};


export async function fetchFromSupabase<T>(table1: string, table2: string, defaultValue: T): Promise<T> {
  try {
    const PAGE_SIZE = 1000;
    const fetchAll = async (tableName: string) => {
      let pageData: any[] = [];
      let records: any[] = [];
      let start = 0;
      do {
        const { data, error } = await supabase.from(tableName).select('*').range(start, start + PAGE_SIZE - 1);
        if (error) throw error;
        pageData = data || [];
        records = records.concat(pageData);
        start += PAGE_SIZE;
      } while (pageData.length === PAGE_SIZE);
      return records;
    };

    try {
      const data = await fetchAll(table1);
      return data as T;
    } catch (error: any) {
      if (error && error.code === '42P01') { // Table not found
        try {
          const data2 = await fetchAll(table2);
          return data2 as T;
        } catch (error2: any) {
          console.warn(`Supabase fetch failed on both ${table1} and ${table2}:`, error2.message);
        }
      } else {
         console.warn(`Supabase fetch failed on ${table1}:`, error.message);
      }
    }
  } catch (err) {
    console.error(`Error querying Supabase for ${table1}:`, err);
  }
  return defaultValue;
}

export async function upsertToSupabase(table1: string, table2: string, records: any[]) {
  if (!records || records.length === 0) return { success: true, error: null };
  // Sanitize undefined values
  const sanitizedRecords = records.map(record => {
    const cleanRecord: any = {};
    Object.keys(record).forEach(key => {
      if (record[key] !== undefined) {
        cleanRecord[key] = record[key];
      }
    });
    return cleanRecord;
  });
  
  const CHUNK_SIZE = 500;
  try {
    for (let i = 0; i < sanitizedRecords.length; i += CHUNK_SIZE) {
      const chunk = sanitizedRecords.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from(table1).upsert(chunk);
      if (error && (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
        const { error: error2 } = await supabase.from(table2).upsert(chunk);
        if (error2) {
          console.warn(`Supabase upsert failed on both ${table1} and ${table2}:`, error2.message);
          return { success: false, error: error2 };
        }
      } else if (error) {
         console.warn(`Supabase upsert failed on ${table1}:`, error.message, error.details, error.hint, error);
         return { success: false, error };
      }
    }
    return { success: true, error: null };
  } catch (err) {
    console.error(`Error upserting to Supabase for ${table1}:`, err);
    return { success: false, error: err };
  }
}

export async function deleteFromSupabase(table1: string, table2: string, keyName: string, keys: any[]) {
  if (!keys || keys.length === 0) return;
  const CHUNK_SIZE = 500;
  try {
    for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
      const chunk = keys.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from(table1).delete().in(keyName, chunk);
      if (error && error.code === '42P01') {
        const { error: error2 } = await supabase.from(table2).delete().in(keyName, chunk);
        if (error2) {
           console.warn(`Supabase delete failed on both ${table1} and ${table2}:`, error2.message);
        }
      } else if (error) {
         console.warn(`Supabase delete failed on ${table1}:`, error.message);
      }
    }
  } catch (err) {
    console.error(`Error deleting from Supabase for ${table1}:`, err);
  }
}

const listeners: Set<(data: any) => void> = new Set();
let dataRealtimeInitialized = false;

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_ASSIGNMENTS: Assignment[] = [];

export const dataService = {
  setupDataRealtime() {
    if (dataRealtimeInitialized) return;
    dataRealtimeInitialized = true;
    
    // Hook into Postgres changes if enabled for assignments
    supabase.channel('vnpt_sync_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vnpt_assignments' }, () => {
          lastAssignmentsSync = 0; // force re-fetch
          this.getAssignments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vnpt_customers' }, () => {
          lastCustomersSync = 0; 
          this.getCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vnpt_batches' }, () => {
          lastBatchesSync = 0; 
          this.getBatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vnpt_potential_customers' }, () => {
          lastPotentialsSync = 0; 
          this.getPotentialCustomers();
      })
      .subscribe();

    // Sync aggressively when task notification arrives
    supabase.channel('vnpt_notifications_channel')
      .on('broadcast', { event: 'new_notification' }, (payload) => {
          const incomingNotif = payload.payload;
          if (incomingNotif && incomingNotif.type === 'TASK') {
             lastAssignmentsSync = 0;
             this.getAssignments();
          }
      })
      .subscribe();

    // Auto-sync when waking up from background/screen off
    document.addEventListener("visibilitychange", () => {
       if (document.visibilityState === "visible") {
          lastAssignmentsSync = 0;
          this.getAssignments();
       }
    });
  },

  // Flag to track active async syncs
  _syncing: { customers: false, assignments: false, batches: false, categories: false, potentials: false },

  // Customers
  async getCustomers() {
     let data = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
     const now = Date.now();
     
     if (this._syncing.customers) return data; // Prevent multiple syncs

     if (now - lastCustomersSync > SYNC_INTERVAL || (data.length === 0 && now - lastCustomersSync > 5000)) {
         this._syncing.customers = true;
         // Trigger background sync
         fetchFromSupabase<Customer[]>('vnpt_customers', 'customers', []).then(dbData => {
           if (dbData) {
             const localData = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
             const dbIds = new Set(dbData.map(c => c.id));
             const localOnly = localData.filter(c => !dbIds.has(c.id));
             
             if (localOnly.length > 0) {
               upsertToSupabase('vnpt_customers', 'customers', localOnly).catch(console.error);
             }
             
             const merged = [...dbData];
             const mergedIds = new Set(merged.map(c => c.id));
             for (const item of localData) {
               if (!mergedIds.has(item.id)) merged.push(item);
             }
             
             setLocal(STORAGE_KEYS.CUSTOMERS, merged);
             lastCustomersSync = Date.now();
             this.notify();
           }
         }).catch(err => {
           console.error("Customers Supabase sync failed:", err);
         }).finally(() => {
           this._syncing.customers = false;
         });
     }
     
     return data;
  },

  async addCustomersBulk(customers: Customer[]) {
    const current = await this.getCustomers();
    const customerMap = new Map<string, Customer>(current.map(c => [c.id, c]));
    
    let addedCount = 0;
    let updatedCount = 0;
    const incomingIds = new Set<string>();
    const upsertList: Customer[] = [];

    for (const c of customers) {
      if (!c) continue;
      const normalizedId = String(c.id || '').trim();
      if (!normalizedId || incomingIds.has(normalizedId)) continue;
      
      incomingIds.add(normalizedId);

      const existing = customerMap.get(normalizedId);
      const updatedCustomer = existing 
        ? { ...existing, ...c, id: normalizedId }
        : { ...c, id: normalizedId };

      if (existing) {
        updatedCount++;
      } else {
        addedCount++;
      }

      customerMap.set(normalizedId, updatedCustomer);
      upsertList.push(updatedCustomer);
    }

    const updatedList = Array.from(customerMap.values());
    setLocal(STORAGE_KEYS.CUSTOMERS, updatedList);

    if (upsertList.length > 0) {
      upsertToSupabase('vnpt_customers', 'customers', upsertList).catch(console.error);
    }

    this.notify();
    
    return {
      added: addedCount,
      updated: updatedCount,
      total: customers.length
    };
  },

  async deleteCustomersBulk(ids: string[]) {
    this._syncing.customers = true;
    this._syncing.assignments = true;
    try {
      await deleteFromSupabase('vnpt_customers', 'customers', 'id', ids);
      await deleteFromSupabase('vnpt_assignments', 'assignments', 'customerId', ids);
    } finally {
      this._syncing.customers = false;
      this._syncing.assignments = false;
    }

    const current = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idSet = new Set(ids);
    const updated = current.filter(c => !idSet.has(c.id));
    setLocal(STORAGE_KEYS.CUSTOMERS, updated);
    
    // Also cleanup assignments
    const currentAssignments = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const updatedAssignments = currentAssignments.filter(a => !idSet.has(a.customerId));
    setLocal(STORAGE_KEYS.ASSIGNMENTS, updatedAssignments);
    
    this.notify();
  },

  // Assignments
  async getAssignments(campaignId?: string) {
    let assignments = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    const now = Date.now();
    
    if (!this._syncing.assignments && (now - lastAssignmentsSync > SYNC_INTERVAL || (assignments.length === 0 && now - lastAssignmentsSync > 5000))) {
         this._syncing.assignments = true;
         fetchFromSupabase<Assignment[]>('vnpt_assignments', 'assignments', []).then(dbAssignments => {
           if (dbAssignments) {
             const localData = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
             const dbIds = new Set(dbAssignments.map(a => `${a.customerId}_${a.campaignId}`));
             const localOnly = localData.filter(a => !dbIds.has(`${a.customerId}_${a.campaignId}`));
             
             if (localOnly.length > 0) {
               upsertToSupabase('vnpt_assignments', 'assignments', localOnly).catch(console.error);
             }
             
             const merged = [...dbAssignments];
             const mergedIds = new Set(merged.map(a => `${a.customerId}_${a.campaignId}`));
             for (const item of localData) {
               if (!mergedIds.has(`${item.customerId}_${item.campaignId}`)) merged.push(item);
             }
             
             setLocal(STORAGE_KEYS.ASSIGNMENTS, merged);
             lastAssignmentsSync = Date.now();
             this.notify();
           }
         }).catch(err => console.error("Assignments sync fail:", err))
           .finally(() => this._syncing.assignments = false);
    }
    
    if (campaignId && campaignId !== 'all') {
      assignments = assignments.filter(a => a.campaignId === campaignId);
    }
    return assignments;
  },

  async createAssignments(assignments: Assignment[]) {
    const current = await this.getAssignments();
    const results = { success: 0, updated: 0, skipped: 0 };
    
    // Use a map for quick lookup and update
    const assignmentMap = new Map<string, Assignment>(current.map(a => [`${a.customerId}_${a.campaignId}`, a]));
    const upsertList: Assignment[] = [];

    assignments.forEach(a => {
        const key = `${a.customerId}_${a.campaignId}`;
        const existing = assignmentMap.get(key);
        let targetAssignment: Assignment;

        if (existing) {
            // Update existing assignment (Adjustment)
            targetAssignment = { 
                ...existing, 
                id: existing.id || Math.random().toString(36).substr(2, 9),
                staffId: a.staffId,
                status: (a.status || existing.status) as Assignment['status'],
                assignedDate: new Date().toISOString(),
                deadline: a.deadline || existing.deadline,
                managerNotes: a.managerNotes || existing.managerNotes,
                priority: a.priority || existing.priority,
                taskType: a.taskType || existing.taskType,
                assignedBy: a.assignedBy || existing.assignedBy
            };
            results.updated++;
            results.success++;
        } else {
            // Create new
            const id = Math.random().toString(36).substr(2, 9);
            targetAssignment = { 
                ...a, 
                id, 
                assignedDate: new Date().toISOString() 
            };
            results.success++;
        }
        assignmentMap.set(key, targetAssignment);
        upsertList.push(targetAssignment);
    });

    setLocal(STORAGE_KEYS.ASSIGNMENTS, Array.from(assignmentMap.values()));

    if (upsertList.length > 0) {
      const dbRes = await upsertToSupabase('vnpt_assignments', 'assignments', upsertList);
      if (!dbRes?.success && dbRes?.error) {
        return { ...results, dbError: dbRes.error.message || dbRes.error.code || JSON.stringify(dbRes.error) };
      }
    }

    this.notify();
    return results;
  },

  async deleteAssignmentsBulk(customerIds: string[], campaignId: string) {
    const currentAssignments = await this.getAssignments();
    const toDeleteKeys = new Set<string>();
    
    currentAssignments.forEach(a => {
        if (customerIds.includes(a.customerId) && (campaignId === 'all' || a.campaignId === campaignId)) {
            toDeleteKeys.add(`${a.customerId}_${a.campaignId}`);
        }
    });

    if (customerIds.length > 0) {
      this._syncing.assignments = true;
      try {
        const CHUNK_SIZE = 500;
        for (let i = 0; i < customerIds.length; i += CHUNK_SIZE) {
            const chunk = customerIds.slice(i, i + CHUNK_SIZE);
            let query1 = supabase.from('vnpt_assignments').delete().in('customerId', chunk);
            if (campaignId && campaignId !== 'all') {
                query1 = query1.eq('campaignId', campaignId);
            }
            const { error: err1 } = await query1;
            
            if (err1 && err1.code === '42P01') {
                let query2 = supabase.from('assignments').delete().in('customerId', chunk);
                if (campaignId && campaignId !== 'all') {
                    query2 = query2.eq('campaignId', campaignId);
                }
                await query2;
            } else if (err1) {
                console.error("Lỗi xóa db:", err1);
            }
        }
      } catch (err) {
        console.error("Error bulk deleting assignments:", err);
      } finally {
        this._syncing.assignments = false;
      }
    }
    
    const finalAssignments = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const updatedAssignments = finalAssignments.filter(a => !toDeleteKeys.has(`${a.customerId}_${a.campaignId}`));
    setLocal(STORAGE_KEYS.ASSIGNMENTS, updatedAssignments);
    this.notify();
  },

  async updateAssignment(id: string, updates: Partial<Assignment>) {
    const current = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    let target: Assignment | null = null;
    const updated = current.map(a => {
      if (a.id === id) {
        target = { ...a, ...updates };
        return target;
      }
      return a;
    });
    setLocal(STORAGE_KEYS.ASSIGNMENTS, updated);

    if (target) {
      const dbRes = await upsertToSupabase('vnpt_assignments', 'assignments', [target]);
      if (!dbRes?.success && dbRes?.error) {
        return { success: false, error: dbRes.error };
      }
    }

    this.notify();
    return { success: true, error: null };
  },

  // Batches
  async getBatches() {
    let batches = getLocal<ImplementationBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    const now = Date.now();
    if (!this._syncing.batches && (now - lastBatchesSync > SYNC_INTERVAL || batches.length === 0)) {
      this._syncing.batches = true;
      fetchFromSupabase<ImplementationBatch[]>('vnpt_batches', 'batches', []).then(dbBatches => {
        if (dbBatches && dbBatches.length > 0) {
          const localData = getLocal<ImplementationBatch[]>(STORAGE_KEYS.BATCHES, []);
          const dbIds = new Set(dbBatches.map(b => b.id));
          const localOnly = localData.filter(b => !dbIds.has(b.id));
          
          if (localOnly.length > 0) {
            upsertToSupabase('vnpt_batches', 'batches', localOnly).catch(console.error);
          }
          const merged = [...dbBatches];
          const mergedIds = new Set(merged.map(b => b.id));
          for (const item of localData) {
            if (!mergedIds.has(item.id)) merged.push(item);
          }
          
          setLocal(STORAGE_KEYS.BATCHES, merged);
          lastBatchesSync = Date.now();
          this.notify();
        } else if (dbBatches && dbBatches.length === 0) {
          if (getLocal(STORAGE_KEYS.BATCHES, null) !== null) {
            const localData = getLocal<ImplementationBatch[]>(STORAGE_KEYS.BATCHES, []);
            if (localData.length > 0) {
              upsertToSupabase('vnpt_batches', 'batches', localData).catch(console.error);
            }
            lastBatchesSync = Date.now();
          } else {
            upsertToSupabase('vnpt_batches', 'batches', batches).catch(console.error);
          }
        }
      }).catch(err => console.error("Batches sync fail:", err))
        .finally(() => this._syncing.batches = false);
    }
    return batches;
  },
  //
  async addBatch(batch: Omit<ImplementationBatch, 'id'>) {
    const current = await this.getBatches();
    const newBatch = { ...batch, id: 'b' + Math.random().toString(36).substr(2, 9) };
    setLocal(STORAGE_KEYS.BATCHES, [...current, newBatch]);

    await upsertToSupabase('vnpt_batches', 'batches', [newBatch]);

    this.notify();
    return newBatch;
  },

  async deleteBatch(id: string) {
    this._syncing.batches = true;
    this._syncing.assignments = true;
    try {
      await deleteFromSupabase('vnpt_assignments', 'assignments', 'campaignId', [id]);
      await deleteFromSupabase('vnpt_batches', 'batches', 'id', [id]);
    } finally {
      this._syncing.batches = false;
      this._syncing.assignments = false;
    }

    const current = getLocal<ImplementationBatch[]>(STORAGE_KEYS.BATCHES, []);
    setLocal(STORAGE_KEYS.BATCHES, current.filter(b => b.id !== id));
    
    // Also cleanup assignments for this batch
    const currentAssignments = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    setLocal(STORAGE_KEYS.ASSIGNMENTS, currentAssignments.filter(a => a.campaignId !== id));

    this.notify();
  },

  async updateBatch(id: string, updates: Partial<ImplementationBatch>) {
    const current = await this.getBatches();
    let target: ImplementationBatch | null = null;
    const updated = current.map(b => {
      if (b.id === id) {
        target = { ...b, ...updates };
        return target;
      }
      return b;
    });
    setLocal(STORAGE_KEYS.BATCHES, updated);

    if (target) {
      await upsertToSupabase('vnpt_batches', 'batches', [target]);
    }

    this.notify();
  },

  // Categories
  async getCategories() {
    let categories = getLocal<ProgramCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const now = Date.now();
    if (!this._syncing.categories && (now - lastCategoriesSync > SYNC_INTERVAL || categories.length === 0)) {
      this._syncing.categories = true;
      fetchFromSupabase<ProgramCategory[]>('vnpt_categories', 'categories', []).then(dbCategories => {
        if (dbCategories && dbCategories.length > 0) {
          const localData = getLocal<ProgramCategory[]>(STORAGE_KEYS.CATEGORIES, []);
          const dbIds = new Set(dbCategories.map(c => c.id));
          const localOnly = localData.filter(c => !dbIds.has(c.id));
          
          if (localOnly.length > 0) {
            upsertToSupabase('vnpt_categories', 'categories', localOnly).catch(console.error);
          }
          const merged = [...dbCategories];
          const mergedIds = new Set(merged.map(c => c.id));
          for (const item of localData) {
            if (!mergedIds.has(item.id)) merged.push(item);
          }
          
          setLocal(STORAGE_KEYS.CATEGORIES, merged);
          lastCategoriesSync = Date.now();
          this.notify();
        } else if (dbCategories && dbCategories.length === 0) {
          if (getLocal(STORAGE_KEYS.CATEGORIES, null) !== null) {
            const localData = getLocal<ProgramCategory[]>(STORAGE_KEYS.CATEGORIES, []);
            if (localData.length > 0) {
              upsertToSupabase('vnpt_categories', 'categories', localData).catch(console.error);
            }
            lastCategoriesSync = Date.now();
          } else {
            upsertToSupabase('vnpt_categories', 'categories', categories).catch(console.error);
          }
        }
      }).catch(err => console.error("Categories sync fail:", err))
        .finally(() => this._syncing.categories = false);
    }
    return categories;
  },
  //
  async addCategory(cat: Omit<ProgramCategory, 'id'>) {
    const current = await this.getCategories();
    const newCat = { ...cat, id: 'cat' + Math.random().toString(36).substr(2, 9) };
    setLocal(STORAGE_KEYS.CATEGORIES, [...current, newCat]);

    await upsertToSupabase('vnpt_categories', 'categories', [newCat]);

    this.notify();
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<ProgramCategory>) {
    const current = await this.getCategories();
    let target: ProgramCategory | null = null;
    const updated = current.map(c => {
      if (c.id === id) {
        target = { ...c, ...updates };
        return target;
      }
      return c;
    });
    setLocal(STORAGE_KEYS.CATEGORIES, updated);

    if (target) {
      await upsertToSupabase('vnpt_categories', 'categories', [target]);
    }

    this.notify();
  },

  async deleteCategory(id: string) {
    const current = getLocal<ProgramCategory[]>(STORAGE_KEYS.CATEGORIES, []);
    const batchIds = (getLocal<ImplementationBatch[]>(STORAGE_KEYS.BATCHES, []))
      .filter(b => b.programId === id)
      .map(b => b.id);
      
    this._syncing.categories = true;
    this._syncing.batches = true;
    this._syncing.assignments = true;
    
    try {
      if (batchIds.length > 0) {
        await deleteFromSupabase('vnpt_assignments', 'assignments', 'campaignId', batchIds);
        await deleteFromSupabase('vnpt_batches', 'batches', 'id', batchIds);
      }
      await deleteFromSupabase('vnpt_categories', 'categories', 'id', [id]);
    } catch (err: any) {
      console.warn("Supabase delete category error - continuing locally:", err.message);
    } finally {
      this._syncing.categories = false;
      this._syncing.batches = false;
      this._syncing.assignments = false;
    }
    
    setLocal(STORAGE_KEYS.CATEGORIES, current.filter(c => c.id !== id));
    
    // Cleanup batches associated with this category
    const currentBatches = getLocal<ImplementationBatch[]>(STORAGE_KEYS.BATCHES, []);
    setLocal(STORAGE_KEYS.BATCHES, currentBatches.filter(b => b.programId !== id));
    
    // Cleanup assignments for all batches in this category
    if (batchIds.length > 0) {
      const currentAssignments = getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
      setLocal(STORAGE_KEYS.ASSIGNMENTS, currentAssignments.filter(a => !batchIds.includes(a.campaignId)));
    }

    this.notify();
  },

  async getPotentialCustomers() {
    let potentials = getLocal<PotentialCustomer[]>(STORAGE_KEYS.POTENTIAL_CUSTOMERS, INITIAL_POTENTIAL_CUSTOMERS);
    const now = Date.now();
    if (!this._syncing.potentials && (now - lastPotentialsSync > SYNC_INTERVAL || (potentials.length === 0 && now - lastPotentialsSync > 5000))) {
      this._syncing.potentials = true;
      fetchFromSupabase<PotentialCustomer[]>('vnpt_potential_customers', 'potential_customers', []).then(async dbPotentials => {
        if (dbPotentials) {
          const deletedIds = getLocal<string[]>(STORAGE_KEYS.DELETED_POTENTIALS, []);
          
          if (deletedIds.length > 0) {
            const stillInDb = dbPotentials.filter(p => deletedIds.includes(p.id));
            if (stillInDb.length > 0) {
              await deleteFromSupabase('vnpt_potential_customers', 'potential_customers', 'id', stillInDb.map(x => x.id));
            }
            dbPotentials = dbPotentials.filter(p => !deletedIds.includes(p.id));
          }

          // Compare with local to avoid losing locally created items that failed to upload
          const localPotentials = getLocal<any[]>(STORAGE_KEYS.POTENTIAL_CUSTOMERS, []);
          const dbIds = new Set(dbPotentials.map(p => p.id));
          
          // Only keep local items that are very recently created (within last 1 hour) AND were never synced to avoid resurrecting deleted items
          const oneHourAgo = Date.now() - 3600000;
          const localOnly = localPotentials.filter(p => !dbIds.has(p.id) && !deletedIds.includes(p.id) && !p._isSynced && new Date(p.createdAt).getTime() > oneHourAgo);
          
          if (localOnly.length > 0) {
             const res = await upsertToSupabase('vnpt_potential_customers', 'potential_customers', localOnly.map(p => { const { _isSynced, ...rest } = p; return rest; }));
             if (res && !res.success) {
               throw new Error(res.error?.message || "Lỗi cập nhật dữ liệu cục bộ lên đám mây");
             }
          }
          
          // Merge
          const merged = [...dbPotentials.map(p => ({ ...p, _isSynced: true }))];
          for (const p of localOnly) {
             merged.push(p);
          }
          
          setLocal(STORAGE_KEYS.POTENTIAL_CUSTOMERS, merged);
          lastPotentialsSync = Date.now();
          this.notify();
        }
      }).catch(err => {
        console.error("Potential customers sync fail:", err);
        this._syncing.potentials = false;
        throw err;
      }).finally(() => this._syncing.potentials = false);
    }
    return potentials;
  },

  async forceSyncPotentials() {
    this._syncing.potentials = true;
    try {
      const dbPotentials = await fetchFromSupabase<PotentialCustomer[]>('vnpt_potential_customers', 'potential_customers', []);
      if (dbPotentials) {
        const deletedIds = getLocal<string[]>(STORAGE_KEYS.DELETED_POTENTIALS, []);
        let workingDbPotentials = dbPotentials;
        
        if (deletedIds.length > 0) {
          const stillInDb = workingDbPotentials.filter(p => deletedIds.includes(p.id));
          if (stillInDb.length > 0) {
            await deleteFromSupabase('vnpt_potential_customers', 'potential_customers', 'id', stillInDb.map(x => x.id));
          }
          workingDbPotentials = workingDbPotentials.filter(p => !deletedIds.includes(p.id));
        }

        const localPotentials = getLocal<any[]>(STORAGE_KEYS.POTENTIAL_CUSTOMERS, []);
        const dbIds = new Set(workingDbPotentials.map(p => p.id));
        
        const oneHourAgo = Date.now() - 3600000;
        const localOnly = localPotentials.filter(p => !dbIds.has(p.id) && !deletedIds.includes(p.id) && !p._isSynced && new Date(p.createdAt).getTime() > oneHourAgo);
        
        if (localOnly.length > 0) {
           const res = await upsertToSupabase('vnpt_potential_customers', 'potential_customers', localOnly.map(p => { const { _isSynced, ...rest } = p; return rest; }));
           if (res && !res.success) {
             throw new Error(res.error?.message || "Lỗi cập nhật dữ liệu cục bộ lên đám mây");
           }
        }
        
        const merged = [...workingDbPotentials.map(p => ({ ...p, _isSynced: true }))];
        for (const p of localOnly) {
           merged.push(p);
        }
        
        setLocal(STORAGE_KEYS.POTENTIAL_CUSTOMERS, merged);
        lastPotentialsSync = Date.now();
        this.notify();
      }
    } catch(err: any) {
      console.error(err);
      throw err;
    } finally {
      this._syncing.potentials = false;
    }
  },

  async addPotentialCustomer(customer: Omit<PotentialCustomer, 'id' | 'createdAt'>) {
    const current = await this.getPotentialCustomers();
    const newCustomer = { 
      ...customer, 
      id: 'pot_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setLocal(STORAGE_KEYS.POTENTIAL_CUSTOMERS, [...current, newCustomer]);

    const res = await upsertToSupabase('vnpt_potential_customers', 'potential_customers', [newCustomer]);
    if (!res?.success) toast.error("Có lỗi khi lưu lên hệ thống đám mây: " + (res?.error?.message || ""));
    this.notify();
    return newCustomer;
  },

  async updatePotentialCustomer(id: string, updates: Partial<PotentialCustomer>) {
    const current = await this.getPotentialCustomers();
    let target: PotentialCustomer | null = null;
    const updated = current.map(c => {
      if (c.id === id) {
        target = { ...c, ...updates };
        return target;
      }
      return c;
    });
    setLocal(STORAGE_KEYS.POTENTIAL_CUSTOMERS, updated);

    if (target) {
      const res = await upsertToSupabase('vnpt_potential_customers', 'potential_customers', [target]);
      if (!res?.success) toast.error("Có lỗi khi cập nhật lên hệ thống: " + (res?.error?.message || ""));
    }

    this.notify();
  },

  async deletePotentialCustomer(id: string) {
    const current = await this.getPotentialCustomers();
    setLocal(STORAGE_KEYS.POTENTIAL_CUSTOMERS, current.filter(c => c.id !== id));
    
    const deletedIds = getLocal<string[]>(STORAGE_KEYS.DELETED_POTENTIALS, []);
    if (!deletedIds.includes(id)) {
      setLocal(STORAGE_KEYS.DELETED_POTENTIALS, [...deletedIds, id]);
    }
    
    await deleteFromSupabase('vnpt_potential_customers', 'potential_customers', 'id', [id]);
    this.notify();
  },

  notify() {
    Array.from(listeners).forEach(l => {
      try {
        l(true);
      } catch (e) {
        console.error("Listener error:", e);
      }
    });
  },

  subscribe(callback: () => void) {
    this.setupDataRealtime();
    listeners.add(callback);
    
    // Fallback sync every 30 seconds
    const interval = setInterval(() => {
      this.getCustomers();
      this.getBatches();
      this.getAssignments();
    }, 30000);
    return () => {
      listeners.delete(callback);
      clearInterval(interval);
    };
  },

  // Realtime Listeners
  subscribeToAssignments(callback: (assignments: Assignment[]) => void, campaignId?: string) {
    this.setupDataRealtime();
    const handler = () => {
      this.getAssignments(campaignId).then(callback);
    };
    
    listeners.add(handler);
    handler(); // Initial call
    
    // Fallback sync every 30 seconds
    const interval = setInterval(handler, 30000);
    
    return () => {
      listeners.delete(handler);
      clearInterval(interval);
    };
  }
};
