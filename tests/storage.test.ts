import { describe, expect, it } from 'vitest';
import { appDataSchema, createAppData } from '../src/engine/model';
import { BACKUP_KEY, readData, STORAGE_KEY, writeData } from '../src/state/storage';
import { BUILTIN_PACKS } from '../src/content';
import { createSession, submitAnswer } from '../src/engine/lesson';
describe('local persistence and recovery', () => {
  it('starts honestly with zero progress and no fake history', () => {
    const { data, status } = readData(localStorage);
    expect(status).toBe('ok');
    expect(data.profiles[0].totals.tasks).toBe(0);
    expect(data.profiles[0].history).toEqual([]);
  });
  it('round-trips all data and keeps the previous valid write as backup', () => {
    const data = createAppData();
    expect(writeData(data, localStorage)).toBe(true);
    const next = { ...data, settings: { reducedMotion: true } };
    expect(writeData(next, localStorage)).toBe(true);
    expect(readData(localStorage).data).toEqual(next);
    expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual(data);
  });
  it('falls back to a valid backup after corruption', () => {
    const data = createAppData();
    localStorage.setItem(STORAGE_KEY, '{invalid');
    localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
    expect(readData(localStorage)).toEqual({ data, status: 'recovered' });
    writeData({ ...data, settings: { reducedMotion: true } }, localStorage);
    expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual(data);
  });
  it('does not silently treat corrupted data as a successful load', () => {
    localStorage.setItem(STORAGE_KEY, '{}');
    localStorage.setItem(BACKUP_KEY, 'broken');
    expect(readData(localStorage).status).toBe('corrupted');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{}');
  });
  it('survives blocked storage and quota failures', () => {
    const blocked = {
      getItem: () => {
        throw new DOMException('Denied');
      },
      setItem: () => {
        throw new DOMException('Full');
      },
    };
    expect(readData(blocked).status).toBe('unavailable');
    expect(writeData(createAppData(), blocked)).toBe(false);
    expect(writeData(createAppData(), { getItem: () => null, setItem: blocked.setItem })).toBe(
      false,
    );
  });
  it('resumes a checked answer and its retry queue exactly', () => {
    const data = createAppData();
    const session = submitAnswer(createSession(BUILTIN_PACKS[4].topics[0], 4), 'wrong');
    data.profiles[0].activeSession = session;
    writeData(data, localStorage);
    const restored = readData(localStorage).data.profiles[0].activeSession;
    expect(restored).toEqual(session);
    expect(restored?.entries).toHaveLength(6);
  });
  it('rejects invalid imports, missing active profiles and broken sessions', () => {
    const data = createAppData();
    expect(appDataSchema.safeParse({ ...data, version: 2 }).success).toBe(false);
    expect(appDataSchema.safeParse({ ...data, activeProfileId: 'unknown' }).success).toBe(false);
    data.profiles[0].activeSession = { ...createSession(BUILTIN_PACKS[4].topics[0], 4), cursor: 8 };
    expect(appDataSchema.safeParse(data).success).toBe(false);
  });
});

it('reports a failed backup write and leaves the current persisted state intact', () => {
  const data = createAppData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const quotaOnBackup = {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      if (key === BACKUP_KEY) throw new DOMException('Quota exceeded');
      localStorage.setItem(key, value);
    },
  };
  expect(writeData({ ...data, settings: { reducedMotion: true } }, quotaOnBackup)).toBe(false);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(data);
});

it('catches an exception from the browser localStorage getter itself', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => {
      throw new DOMException('Security error');
    },
  });
  try {
    expect(readData().status).toBe('unavailable');
    expect(writeData(createAppData())).toBe(false);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', descriptor);
  }
});
