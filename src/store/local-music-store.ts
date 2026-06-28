import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LocalMusicFile } from "@/plugins/local-music";
import { storeKey } from "./store-keys";
import { idbStorage } from "@/lib/storage-adapter";

interface LocalMusicState {
  files: LocalMusicFile[];
  isScanning: boolean;
  scanType: "quick" | "full" | null;
  scanDirectory: string;
  minScanFileSizeMb: number;

  setFiles: (files: LocalMusicFile[]) => void;
  updateFiles: (updater: (files: LocalMusicFile[]) => LocalMusicFile[]) => void;
  clear: () => void;
  setScanning: (isScanning: boolean, scanType?: "quick" | "full") => void;
  setScanDirectory: (scanDirectory: string) => void;
  setMinScanFileSizeMb: (minScanFileSizeMb: number) => void;
}

export const useLocalMusicStore = create<LocalMusicState>()(
  persist(
    (set) => ({
      files: [],
      isScanning: false,
      scanType: null,
      scanDirectory: "",
      minScanFileSizeMb: 1,

      setFiles: (files) => set({ files }),
      updateFiles: (updater) =>
        set((state) => ({ files: updater(state.files) })),
      clear: () => set({ files: [] }),
      setScanning: (isScanning, scanType) =>
        set({ isScanning, scanType: scanType || null }),
      setScanDirectory: (scanDirectory) => set({ scanDirectory }),
      setMinScanFileSizeMb: (minScanFileSizeMb) => set({ minScanFileSizeMb }),
    }),
    {
      name: storeKey.LocalMusicStore,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        files: state.files,
        scanDirectory: state.scanDirectory,
        minScanFileSizeMb: state.minScanFileSizeMb,
      }),
    }
  )
);
