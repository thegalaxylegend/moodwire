import { create } from 'zustand';

interface PWAStore {
    showInstallModal: boolean;
    setShowInstallModal: (show: boolean) => void;
}

export const usePWAStore = create<PWAStore>((set) => ({
    showInstallModal: false,
    setShowInstallModal: (show: boolean) => set({ showInstallModal: show }),
}));
