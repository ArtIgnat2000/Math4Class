import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getPack } from '../content';
import type { ContentPack, Grade } from '../engine/content';
import { appDataSchema, createProfile, type AppData, type Profile } from '../engine/model';
import { readData, writeData, STORAGE_KEY, type StorageStatus } from './storage';

type DataUpdate = (data: AppData) => AppData;
interface AppContextValue {
  data: AppData;
  profile: Profile;
  pack: ContentPack;
  storageStatus: StorageStatus;
  update: (updater: DataUpdate) => void;
  updateProfile: (updater: (profile: Profile) => Profile) => void;
  setGrade: (grade: Grade) => void;
  addProfile: (name: string, grade: Grade, avatar: Profile['avatar']) => void;
  replaceData: (data: AppData) => void;
  acknowledgeStorage: () => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return readData();
    } catch {
      return {
        data: {
          version: 1,
          activeProfileId: '',
          profiles: [],
          settings: { reducedMotion: false },
          customPacks: [],
        } as AppData,
        status: 'unavailable' as const,
      };
    }
  });
  // localStorage's getter itself can throw in privacy modes.
  const [data, setData] = useState<AppData>(() =>
    initial.data.profiles.length
      ? initial.data
      : (() => {
          const profile = createProfile();
          return { ...initial.data, activeProfileId: profile.id, profiles: [profile] };
        })(),
  );
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(initial.status);
  const dataRef = useRef(data);
  const update = useCallback((updater: DataUpdate) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    if (!writeData(next)) setStorageStatus('unavailable');
  }, []);
  const updateProfile = useCallback(
    (updater: (profile: Profile) => Profile) => {
      update((current) => ({
        ...current,
        profiles: current.profiles.map((p) => (p.id === current.activeProfileId ? updater(p) : p)),
      }));
    },
    [update],
  );
  useEffect(() => {
    const syncTab = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = appDataSchema.safeParse(JSON.parse(event.newValue));
        if (parsed.success) {
          dataRef.current = parsed.data;
          setData(parsed.data);
        }
      } catch {
        /* A corrupt external write must not replace a valid open profile. */
      }
    };
    window.addEventListener('storage', syncTab);
    return () => window.removeEventListener('storage', syncTab);
  }, []);
  const profile = data.profiles.find((p) => p.id === data.activeProfileId)!;
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'reduced-motion',
        data.settings.reducedMotion || !!media?.matches,
      );
    apply();
    media?.addEventListener('change', apply);
    return () => media?.removeEventListener('change', apply);
  }, [data.settings.reducedMotion]);
  return (
    <AppContext.Provider
      value={{
        data,
        profile,
        pack: getPack(profile.grade, data.customPacks),
        storageStatus,
        update,
        updateProfile,
        setGrade: (grade) => updateProfile((p) => ({ ...p, grade })),
        addProfile: (name, grade, avatar) =>
          update((current) => {
            if (current.profiles.length >= 12) return current;
            const child = createProfile(name.trim(), grade, avatar);
            return {
              ...current,
              activeProfileId: child.id,
              profiles: [...current.profiles, child],
            };
          }),
        replaceData: (next) => update(() => next),
        acknowledgeStorage: () => setStorageStatus('ok'),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider is required');
  return context;
}
