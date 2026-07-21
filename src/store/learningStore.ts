import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Language } from './ideStore'

export interface SavedSolution {
  problemId: string
  language: Language
  code: string
  updatedAt: number
}

export interface ProblemProgress {
  problemId: string
  attempts: number
  passes: number
  lastScore: number
  lastAttemptAt: number
  reviewIntervalDays: number
  nextReviewAt: number
}

interface LearningState {
  bookmarks: string[]
  notes: Record<string, string>
  solutions: Record<string, SavedSolution>
  progress: Record<string, ProblemProgress>
  telemetryConsent: boolean
  toggleBookmark: (problemId: string) => void
  setNote: (problemId: string, note: string) => void
  saveSolution: (problemId: string, language: Language, code: string) => void
  recordJudgeResult: (problemId: string, passed: number, total: number) => void
  setTelemetryConsent: (consent: boolean) => void
}

export function solutionKey(problemId: string, language: Language): string {
  return `${problemId}:${language}`
}

export function dueReviewCount(progress: Record<string, ProblemProgress>, now = Date.now()): number {
  return Object.values(progress).filter(item => item.nextReviewAt <= now).length
}

export const useLearningStore = create<LearningState>()(persist((set) => ({
  bookmarks: [],
  notes: {},
  solutions: {},
  progress: {},
  telemetryConsent: false,

  toggleBookmark: (problemId) => set(state => ({
    bookmarks: state.bookmarks.includes(problemId)
      ? state.bookmarks.filter(id => id !== problemId)
      : [...state.bookmarks, problemId],
  })),

  setNote: (problemId, note) => set(state => ({ notes: { ...state.notes, [problemId]: note.slice(0, 10_000) } })),

  saveSolution: (problemId, language, code) => set(state => ({
    solutions: {
      ...state.solutions,
      [solutionKey(problemId, language)]: { problemId, language, code: code.slice(0, 100_000), updatedAt: Date.now() },
    },
  })),

  recordJudgeResult: (problemId, passed, total) => set(state => {
    const previous = state.progress[problemId]
    const score = total > 0 ? passed / total : 0
    const previousInterval = previous?.reviewIntervalDays || 0
    const interval = score === 1
      ? previousInterval <= 1 ? 3 : Math.min(60, Math.round(previousInterval * 2.2))
      : 1
    const now = Date.now()
    return {
      progress: {
        ...state.progress,
        [problemId]: {
          problemId,
          attempts: (previous?.attempts || 0) + 1,
          passes: (previous?.passes || 0) + (score === 1 ? 1 : 0),
          lastScore: score,
          lastAttemptAt: now,
          reviewIntervalDays: interval,
          nextReviewAt: now + interval * 24 * 60 * 60 * 1000,
        },
      },
    }
  }),

  setTelemetryConsent: (telemetryConsent) => set({ telemetryConsent }),
}), {
  name: 'algovision-learning-v1',
  storage: createJSONStorage(() => localStorage),
  partialize: state => ({
    bookmarks: state.bookmarks,
    notes: state.notes,
    solutions: state.solutions,
    progress: state.progress,
    telemetryConsent: state.telemetryConsent,
  }),
}))
