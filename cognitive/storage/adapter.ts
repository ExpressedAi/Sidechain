/**
 * Storage adapter for SideChain's $idb system
 * Maps your dbService API to SideChain's architecture
 */

// This will be initialized by SideChain's background script
let $idb: any = null;

export function initializeStorage(idbInstance: any) {
  $idb = idbInstance;
}

export const storageAdapter = {
  async getSetting(key: string, defaultValue?: any): Promise<any> {
    if (!$idb) {
      console.warn('[Storage] $idb not initialized, using localStorage fallback');
      const val = localStorage.getItem(`sidechain_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    }
    return await $idb.get(key, defaultValue);
  },

  async saveSetting(key: string, value: any): Promise<void> {
    if (!$idb) {
      console.warn('[Storage] $idb not initialized, using localStorage fallback');
      localStorage.setItem(`sidechain_${key}`, JSON.stringify(value));
      return;
    }
    await $idb.set(key, value);
  },

  async removeSetting(key: string): Promise<void> {
    if (!$idb) {
      localStorage.removeItem(`sidechain_${key}`);
      return;
    }
    await $idb.remove(key);
  },

  async getAllKeys(): Promise<string[]> {
    if (!$idb) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sidechain_')) {
          keys.push(key.replace('sidechain_', ''));
        }
      }
      return keys;
    }
    return await $idb.keys();
  }
};
