// lib/store.ts
import { create } from 'zustand'

type DashboardStore = {
  links: { link: string; source: string }[]
  files: File[]
  setLinks: (links: { link: string; source: string }[]) => void
  setFiles: (files: File[]) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  links: [],
  files: [],
  setLinks: (links) => set({ links }),
  setFiles: (files) => set({ files }),
}))
