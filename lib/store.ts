import { create } from "zustand"
import type { User, QueueEntry, DashboardStats } from "@/types"

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

interface QueueStore {
  entries: QueueEntry[]
  setEntries: (entries: QueueEntry[]) => void
  selectedStation: string
  setSelectedStation: (station: string) => void
}

export const useQueueStore = create<QueueStore>((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
  selectedStation: "LAB",
  setSelectedStation: (station) => set({ selectedStation: station }),
}))

interface DashboardStore {
  stats: DashboardStats | null
  setStats: (stats: DashboardStats) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
}))
