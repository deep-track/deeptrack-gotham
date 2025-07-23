import { create } from 'zustand'

type FileMeta = {
  name: string
  type: string
  size: number
}

type Result = {
  confidence: number
  isAuthentic: boolean
  processingTime: number
}

type ResultData = {
  imageBase64: string
  fileMeta: FileMeta
  result: Result
  timestamp: string
}

type DashboardStore = {
  links: { link: string; source: string }[]
  files: File[]
  resultData: ResultData[] | null
  setLinks: (links: { link: string; source: string }[]) => void
  setFiles: (files: File[]) => void
  setResultData: (resultData: ResultData[] | ResultData) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  files: [],
  links: [],
  resultData: null,
  setFiles: (files) => set({ files }),
  setLinks: (links) => set({ links }),
  setResultData: (resultData) =>
    set({
      resultData: Array.isArray(resultData) ? resultData : [resultData],
    }),
}))
