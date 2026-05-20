import { create } from 'zustand'
import type { ExerciseType } from './program'

export interface CompletedSet {
  exerciseKey: ExerciseType
  setNumber: number
  reps?: number
  holdSec?: number
  completed: boolean
}

interface SessionStore {
  currentExerciseIndex: number
  currentSetIndex: number
  completedSets: CompletedSet[]
  sessionStartTime: Date | null
  phase: 'exercise' | 'rest' | 'done'
  initSession: () => void
  recordSet: (set: CompletedSet) => void
  goToRest: () => void
  advanceSet: (setsInExercise: number, totalExercises: number) => void
  resetSession: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  completedSets: [],
  sessionStartTime: null,
  phase: 'exercise',

  initSession: () =>
    set({
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      sessionStartTime: new Date(),
      phase: 'exercise',
    }),

  recordSet: (completedSet) =>
    set((s) => ({ completedSets: [...s.completedSets, completedSet] })),

  goToRest: () => set({ phase: 'rest' }),

  advanceSet: (setsInExercise, totalExercises) =>
    set((s) => {
      const nextSet = s.currentSetIndex + 1
      if (nextSet < setsInExercise) {
        return { currentSetIndex: nextSet, phase: 'exercise' }
      }
      const nextExercise = s.currentExerciseIndex + 1
      if (nextExercise < totalExercises) {
        return { currentExerciseIndex: nextExercise, currentSetIndex: 0, phase: 'exercise' }
      }
      return { phase: 'done' }
    }),

  resetSession: () =>
    set({
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      sessionStartTime: null,
      phase: 'exercise',
    }),
}))
