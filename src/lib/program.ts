export type ExerciseType = 'type2_hold' | 'power_flutter' | 'type1_endurance'

export interface Exercise {
  key: ExerciseType
  name: string
  description: string
  sets: number
  reps?: number
  holdSec?: number
  restSec: number
}

export interface SessionPlan {
  sessionType: 'morning' | 'midday' | 'evening'
  exercises: Exercise[]
}

export interface ProgramState {
  phase: 1 | 2 | 3
  weekInPhase: 1 | 2 | 3 | 4
  weekOverall: number
  isDeload: boolean
}

export function getProgramState(startDate: Date): ProgramState {
  const now = new Date()
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weekOverall = Math.floor((now.getTime() - startDate.getTime()) / msPerWeek) + 1

  const cycleWeek = ((weekOverall - 1) % 12) + 1
  const phase = cycleWeek <= 4 ? 1 : cycleWeek <= 8 ? 2 : 3
  const weekInPhase = (((weekOverall - 1) % 4) + 1) as 1 | 2 | 3 | 4
  const isDeload = weekInPhase === 4

  return { phase: phase as 1 | 2 | 3, weekInPhase, weekOverall, isDeload }
}

const NAMES: Record<ExerciseType, { name: string; description: string }> = {
  type2_hold: {
    name: 'Spięcia z trzymaniem (Typ II)',
    description:
      '100% napięcia. Pełny relaks 5 sek. po każdym powtórzeniu. Bez kompensacji brzucha i pośladków.',
  },
  power_flutter: {
    name: 'Szybkie uderzenia (Power)',
    description: 'Maksymalny skurcz → pełny luz. Tempo 1-0-1.',
  },
  type1_endurance: {
    name: 'Długie trzymanie (Typ I)',
    description: '65-70% napięcia. Równomierny oddech przez cały czas. Bez kompensacji.',
  },
}

function ex(
  key: ExerciseType,
  overrides: Partial<Omit<Exercise, 'key' | 'name' | 'description'>>,
  descriptionOverride?: string,
): Exercise {
  return {
    key,
    name: NAMES[key].name,
    description: descriptionOverride ?? NAMES[key].description,
    sets: overrides.sets!,
    reps: overrides.reps,
    holdSec: overrides.holdSec,
    restSec: overrides.restSec!,
  }
}

export function getSessionPlan(
  sessionType: 'morning' | 'midday' | 'evening',
  state: ProgramState,
): SessionPlan {
  const { phase, weekInPhase, isDeload } = state
  const exercises = buildExercises(sessionType, phase, weekInPhase, isDeload)
  return { sessionType, exercises }
}

function buildExercises(
  sessionType: 'morning' | 'midday' | 'evening',
  phase: 1 | 2 | 3,
  weekInPhase: 1 | 2 | 3 | 4,
  isDeload: boolean,
): Exercise[] {
  // ── DELOAD (weekInPhase === 4) ──────────────────────────────────────────────
  if (isDeload) {
    const holdSec = phase === 1 ? 45 : phase === 2 ? 60 : 75
    const holdSec2 = phase === 1 ? 3 : phase === 2 ? 5 : 8

    if (sessionType === 'morning') {
      return [ex('type2_hold', { sets: 2, holdSec: holdSec2, restSec: 90 })]
    }
    if (sessionType === 'midday') {
      return [ex('type1_endurance', { sets: 2, holdSec, restSec: 90 })]
    }
    // evening
    return [ex('type1_endurance', { sets: 2, holdSec, restSec: 90 })]
  }

  // ── PHASE 1 ─────────────────────────────────────────────────────────────────
  if (phase === 1) {
    const isProgressed = weekInPhase >= 3
    const enduranceHold = isProgressed ? 50 : 45

    if (sessionType === 'morning') {
      return [
        ex('type2_hold', { sets: 3, holdSec: 3, restSec: 90 }),
        ex('power_flutter', { sets: 2, reps: 10, restSec: 60 }),
      ]
    }
    if (sessionType === 'midday') {
      return [ex('type1_endurance', { sets: 3, holdSec: enduranceHold, restSec: 90 })]
    }
    // evening
    return [
      ex(
        'type1_endurance',
        { sets: 3, holdSec: enduranceHold, restSec: 90 },
        'Drugi blok wytrzymałości – kluczowy dla tonusu spoczynkowego.',
      ),
      ex(
        'power_flutter',
        { sets: 2, reps: 20, restSec: 60 },
        'Szybkie rytmiczne spięcia 1 na sekundę bez pauzy.',
      ),
    ]
  }

  // ── PHASE 2 ─────────────────────────────────────────────────────────────────
  if (phase === 2) {
    const isProgressed = weekInPhase >= 3
    const enduranceHold = isProgressed ? 65 : 60

    if (sessionType === 'morning') {
      return [
        ex('type2_hold', { sets: 4, holdSec: 5, restSec: 90 }),
        ex('power_flutter', { sets: 3, reps: 10, restSec: 60 }),
      ]
    }
    if (sessionType === 'midday') {
      return [ex('type1_endurance', { sets: 3, holdSec: enduranceHold, restSec: 90 })]
    }
    // evening
    return [
      ex(
        'type1_endurance',
        { sets: 3, holdSec: enduranceHold, restSec: 90 },
        'Drugi blok wytrzymałości – kluczowy dla tonusu spoczynkowego.',
      ),
      ex(
        'power_flutter',
        { sets: 3, reps: 20, restSec: 60 },
        'Szybkie rytmiczne spięcia 1 na sekundę bez pauzy.',
      ),
    ]
  }

  // ── PHASE 3 ─────────────────────────────────────────────────────────────────
  const isProgressed = weekInPhase >= 3
  const enduranceHold = isProgressed ? 90 : 75

  if (sessionType === 'morning') {
    return [
      ex('type2_hold', { sets: 4, holdSec: 8, restSec: 90 }),
      ex('power_flutter', { sets: 3, reps: 10, restSec: 60 }),
    ]
  }
  if (sessionType === 'midday') {
    return [ex('type1_endurance', { sets: 3, holdSec: enduranceHold, restSec: 90 })]
  }
  // evening
  return [
    ex(
      'type1_endurance',
      { sets: 3, holdSec: enduranceHold, restSec: 90 },
      'Drugi blok wytrzymałości – kluczowy dla tonusu spoczynkowego.',
    ),
    ex(
      'power_flutter',
      { sets: 3, reps: 25, restSec: 60 },
      'Szybkie rytmiczne spięcia 1 na sekundę bez pauzy.',
    ),
  ]
}
