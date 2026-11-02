import { appDataSchema, createAppData, type AppData } from '../engine/model';
export const STORAGE_KEY = 'chislo:data:v1';
export const BACKUP_KEY = 'chislo:backup:v1';
export type StorageStatus = 'ok' | 'recovered' | 'unavailable' | 'corrupted';
export function readData(storage?: Pick<Storage, 'getItem'>): {
  data: AppData;
  status: StorageStatus;
} {
  let hadInvalid = false;
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return { data: createAppData(), status: 'unavailable' };
    for (const [index, key] of [STORAGE_KEY, BACKUP_KEY].entries()) {
      const raw = target.getItem(key);
      if (!raw) continue;
      try {
        const parsed = appDataSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return { data: parsed.data, status: index ? 'recovered' : 'ok' };
      } catch {
        /* Try the last valid backup before making a fresh profile. */
      }
      hadInvalid = true;
    }
    return { data: createAppData(), status: hadInvalid ? 'corrupted' : 'ok' };
  } catch {
    return { data: createAppData(), status: 'unavailable' };
  }
}
export function writeData(data: AppData, storage?: Pick<Storage, 'getItem' | 'setItem'>): boolean {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    const previous = target.getItem(STORAGE_KEY);
    if (previous) {
      let validPrevious = false;
      try {
        validPrevious = appDataSchema.safeParse(JSON.parse(previous)).success;
      } catch {
        /* Never overwrite the valid backup with corrupt data. */
      }
      // A backup write failure is a persistence failure, not a JSON parse failure.
      if (validPrevious) target.setItem(BACKUP_KEY, previous);
    }
    target.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
