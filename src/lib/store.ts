// lib/store.ts
import { create } from 'zustand'

type DashboardStore = {
  links: { link: string; source: string }[]
  files: File[]
  setLinks: (links: { link: string; source: string }[]) => void
  setFiles: (files: File[]) => void
}

export const useDashboardStore = create((set) => ({
  files: [],
  links: [],
  resultData: null,
  setFiles: (files) => set({ files }),
  setLinks: (links) => set({ links }),
  setResultData: (resultData) => set({ resultData }),
}))
