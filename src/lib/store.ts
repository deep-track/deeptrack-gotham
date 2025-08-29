import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RealityDefenderModel {
  name: string
  status: "AUTHENTIC" | "MANIPULATED" | "UNKNOWN"
  score: number
}

export interface RealityDefenderRaw {
  requestId: string
  status: "AUTHENTIC" | "MANIPULATED" | "UNKNOWN"
  score: number
  models: RealityDefenderModel[]
  [key: string]: unknown
}

export interface Result {
  requestId: string
  status: "AUTHENTIC" | "MANIPULATED" | "UNKNOWN"
  score: number
  models: RealityDefenderModel[]
  raw: RealityDefenderRaw
}

export type FileMeta = {
  name: string
  type: string
  size: number
}

export type ResultData = {
  imageBase64: string
  fileMeta: FileMeta
  result: Result
  timestamp: string
}

type DashboardStore = {
  links: { link: string; source: string }[]
  files: File[]
  resultData: ResultData[]
  setLinks: (links: { link: string; source: string }[]) => void
  setFiles: (files: File[]) => void
  setResultData: (resultData: ResultData[] | ResultData) => void
  clearResults: () => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      files: [],
      links: [],
      resultData: [],
      setFiles: (files) => set({ files }),
      setLinks: (links) => set({ links }),
      setResultData: (resultData) =>
        set((state) => ({
          resultData: [
            ...state.resultData,
            ...(Array.isArray(resultData) ? resultData : [resultData]),
          ],
        })),
      clearResults: () => set({ resultData: [] }),
    }),
    {
      name: "deeptrack-history", // localStorage key
    }
  )
)