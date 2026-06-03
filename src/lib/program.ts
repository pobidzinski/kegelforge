import { EXERCISES } from './exercises'

export type SessionType = 'session_a' | 'session_b' | 'session_c'

export interface ExercisePhase {
  type: 'reps' | 'hold'
  reps: number
  holdSec?: number
}

export interface Exercise {
  key: string
  name: string
  description: string
  sets: number
  restSec: number
  muscleTarget: string
  // RepsView
  reps?: number
  // RepTimedView (N reps each M seconds per set)
  repReps?: number
  repHoldSec?: number
  repRestSec?: number
  // MixedView
  phases?: ExercisePhase[]
}

export interface SessionPlan {
  sessionType: SessionType
  exercises: Exercise[]
}

export type ProgramStatus = 'active' | 'completed'

export interface ProgramState {
  status: ProgramStatus
  cycle: 1 | 2
  phase: 1 | 2 | 3
  weekInPhase: 1 | 2 | 3 | 4
  weekOverall: number
  isDeload: boolean
}

export function getProgramState(startDate: Date, today: Date = new Date()): ProgramState {
  const msPerDay = 24 * 60 * 60 * 1000
  const totalDays = Math.floor((today.getTime() - startDate.getTime()) / msPerDay)
  const weekOverall = Math.floor(totalDays / 7) + 1

  if (weekOverall > 24) {
    return {
      status: 'completed',
      cycle: 2,
      phase: 3,
      weekInPhase: 4,
      weekOverall: 24,
      isDeload: true,
    }
  }

  const cycle: 1 | 2 = weekOverall <= 12 ? 1 : 2
  const weekInCycle = cycle === 1 ? weekOverall : weekOverall - 12
  const phase = Math.ceil(weekInCycle / 4) as 1 | 2 | 3
  const weekInPhase = (((weekInCycle - 1) % 4) + 1) as 1 | 2 | 3 | 4
  const isDeload = weekInPhase === 4

  return { status: 'active', cycle, phase, weekInPhase, weekOverall, isDeload }
}

function ex(
  key: string,
  params: {
    sets: number
    restSec: number
    reps?: number
    repReps?: number
    repHoldSec?: number
    repRestSec?: number
    phases?: ExercisePhase[]
  },
): Exercise {
  const def = EXERCISES.find((e) => e.key === key)
  if (!def) throw new Error(`Exercise ${key} not found`)
  return {
    key,
    name: def.name,
    description: def.cue,
    sets: params.sets,
    restSec: params.restSec,
    muscleTarget: def.muscle_target,
    reps: params.reps,
    repReps: params.repReps,
    repHoldSec: params.repHoldSec,
    repRestSec: params.repRestSec,
    phases: params.phases,
  }
}

// ─── Cycle 1 ──────────────────────────────────────────────────────────────────

function c1SessionA(phase: 1 | 2 | 3, isDeload: boolean): Exercise[] {
  if (isDeload) {
    if (phase === 1 || phase === 2) {
      return [
        ex('quick_flicks',  { sets: 2, reps: 10, restSec: 90 }),
        ex('reverse_kegel', { sets: 3, reps: 8, restSec: 45 }),
      ]
    }
    // phase 3 deload
    return [
      ex('quick_flicks',  { sets: 2, reps: 10, restSec: 90 }),
      ex('iso_hold_ic',   { sets: 2, repReps: 6, repHoldSec: 4, restSec: 120 }),
      ex('reverse_kegel', { sets: 2, reps: 8, restSec: 45 }),
    ]
  }

  if (phase === 1) {
    return [
      ex('quick_flicks',  { sets: 4, reps: 10, restSec: 90 }),
      ex('iso_hold_ic',   { sets: 3, repReps: 6, repHoldSec: 3, restSec: 120 }),
      ex('reverse_kegel', { sets: 2, reps: 8, restSec: 45 }),
    ]
  }
  if (phase === 2) {
    return [
      ex('quick_flicks',  { sets: 4, reps: 10, restSec: 60 }),
      ex('iso_hold_ic',   { sets: 3, repReps: 6, repHoldSec: 5, restSec: 120 }),
      ex('iso_hold_ic',   { sets: 2, repReps: 4, repHoldSec: 5, restSec: 120 }),
      ex('reverse_kegel', { sets: 2, reps: 8, restSec: 45 }),
    ]
  }
  // phase 3
  return [
    ex('quick_flicks',  { sets: 4, reps: 10, restSec: 60 }),
    ex('iso_hold_ic',   { sets: 4, repReps: 6, repHoldSec: 6, restSec: 120 }),
    ex('reverse_kegel', { sets: 3, reps: 8, restSec: 45 }),
  ]
}

function c1SessionB(phase: 1 | 2 | 3, isDeload: boolean): Exercise[] {
  if (isDeload) {
    if (phase === 1) {
      return [
        ex('endurance_hold_bs', { sets: 2, repReps: 6, repHoldSec: 10, repRestSec: 5, restSec: 60 }),
        ex('reverse_kegel',     { sets: 2, reps: 8, restSec: 45 }),
      ]
    }
    if (phase === 2) {
      return [
        ex('endurance_hold_bs', { sets: 2, repReps: 6, repHoldSec: 15, repRestSec: 5, restSec: 60 }),
        ex('reverse_kegel',     { sets: 2, reps: 8, restSec: 45 }),
      ]
    }
    // phase 3 deload
    return [
      ex('endurance_hold_bs', { sets: 2, repReps: 6, repHoldSec: 20, repRestSec: 5, restSec: 60 }),
      ex('reverse_kegel',     { sets: 2, reps: 8, restSec: 45 }),
    ]
  }

  if (phase === 1) {
    return [
      ex('endurance_hold_bs', { sets: 3, repReps: 8, repHoldSec: 10, repRestSec: 5, restSec: 60 }),
      ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  if (phase === 2) {
    return [
      ex('endurance_hold_bs', { sets: 3, repReps: 8, repHoldSec: 20, repRestSec: 5, restSec: 60 }),
      ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  // phase 3
  return [
    ex('endurance_hold_bs', { sets: 3, repReps: 8, repHoldSec: 30, repRestSec: 5, restSec: 60 }),
    ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
  ]
}

const SQUAT_PHASES: ExercisePhase[] = [
  { type: 'reps', reps: 5 },
  { type: 'hold', reps: 5, holdSec: 5 },
]

function c1SessionC(phase: 1 | 2 | 3, isDeload: boolean): Exercise[] {
  if (isDeload) {
    if (phase === 1 || phase === 2) {
      return [
        ex('bs_isolation',  { sets: 2, repReps: 8, repHoldSec: 3, restSec: 60 }),
        ex('reverse_kegel', { sets: 2, reps: 8, restSec: 45 }),
      ]
    }
    // phase 3 deload
    return [
      ex('squat_integration', { sets: 2, phases: SQUAT_PHASES, restSec: 90 }),
      ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
    ]
  }

  if (phase === 1) {
    return [
      ex('bs_isolation',  { sets: 3, repReps: 10, repHoldSec: 3, restSec: 60 }),
      ex('reverse_kegel', { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  if (phase === 2) {
    return [
      ex('squat_integration', { sets: 3, phases: SQUAT_PHASES, restSec: 90 }),
      ex('bs_isolation',      { sets: 3, repReps: 10, repHoldSec: 3, restSec: 60 }),
      ex('reverse_kegel',     { sets: 2, reps: 8, restSec: 45 }),
    ]
  }
  // phase 3
  return [
    ex('squat_integration', { sets: 4, phases: SQUAT_PHASES, restSec: 90 }),
    ex('bs_isolation',      { sets: 3, repReps: 10, repHoldSec: 5, restSec: 60 }),
    ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
  ]
}

// ─── Cycle 2 ──────────────────────────────────────────────────────────────────

function c2SessionA(phase: 1 | 2 | 3, isDeload: boolean): Exercise[] {
  if (isDeload) {
    if (phase === 1) {
      return [
        ex('quick_flicks',  { sets: 2, reps: 10, restSec: 90 }),
        ex('iso_hold_ic',   { sets: 2, repReps: 6, repHoldSec: 4, restSec: 120 }),
        ex('reverse_kegel', { sets: 3, reps: 8, restSec: 45 }),
      ]
    }
    if (phase === 2) {
      return [
        ex('quick_flicks',      { sets: 2, reps: 10, restSec: 90 }),
        ex('iso_hold_ic_lunge', { sets: 2, repReps: 4, repHoldSec: 5, restSec: 120 }),
        ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
      ]
    }
    // phase 3 deload
    return [
      ex('quick_flicks',  { sets: 2, reps: 10, restSec: 90 }),
      ex('iso_hold_ic',   { sets: 2, repReps: 6, repHoldSec: 6, restSec: 120 }),
      ex('reverse_kegel', { sets: 3, reps: 8, restSec: 45 }),
    ]
  }

  if (phase === 1) {
    return [
      ex('quick_flicks',      { sets: 4, reps: 10, restSec: 45 }),
      ex('iso_hold_ic',       { sets: 4, repReps: 6, repHoldSec: 6, restSec: 120 }),
      ex('iso_hold_ic_lunge', { sets: 2, repReps: 4, repHoldSec: 5, restSec: 120 }),
      ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  if (phase === 2) {
    return [
      ex('quick_flicks',      { sets: 4, reps: 12, restSec: 45 }),
      ex('iso_hold_ic',       { sets: 4, repReps: 6, repHoldSec: 8, restSec: 120 }),
      ex('iso_hold_ic_lunge', { sets: 3, repReps: 5, repHoldSec: 6, restSec: 120 }),
      ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  // phase 3
  return [
    ex('quick_flicks',      { sets: 5, reps: 12, restSec: 45 }),
    ex('iso_hold_ic',       { sets: 4, repReps: 6, repHoldSec: 10, restSec: 120 }),
    ex('iso_hold_ic_lunge', { sets: 3, repReps: 6, repHoldSec: 8, restSec: 120 }),
    ex('reverse_kegel',     { sets: 3, reps: 10, restSec: 45 }),
  ]
}

function c2SessionB(phase: 1 | 2 | 3, isDeload: boolean): Exercise[] {
  if (isDeload) {
    // All deloads for C2 use seated version
    const holdSec = phase === 1 ? 20 : phase === 2 ? 30 : 40
    return [
      ex('endurance_hold_bs', { sets: 2, repReps: 6, repHoldSec: holdSec, repRestSec: 5, restSec: 60 }),
      ex('reverse_kegel',     { sets: 2, reps: 8, restSec: 45 }),
    ]
  }

  if (phase === 1) {
    return [
      ex('endurance_hold_bs_standing', { sets: 3, repReps: 8, repHoldSec: 30, repRestSec: 5, restSec: 60 }),
      ex('reverse_kegel',              { sets: 3, reps: 10, restSec: 45 }),
    ]
  }
  if (phase === 2) {
    return [
      ex('endurance_hold_bs_standing', { sets: 3, repReps: 8, repHoldSec: 45, repRestSec: 5, restSec: 60 }),
      ex('reverse_kegel',              { sets: 3, reps: 10, restSec: 45 }),
    ]
  }
  // phase 3
  return [
    ex('endurance_hold_bs_standing', { sets: 3, repReps: 8, repHoldSec: 60, repRestSec: 5, restSec: 60 }),
    ex('reverse_kegel',              { sets: 4, reps: 10, restSec: 45 }),
  ]
}

function c2SessionC(phase: 1 | 2 | 3, isDeload: boolean): Exercise[] {
  if (isDeload) {
    if (phase === 1) {
      return [
        ex('squat_integration', { sets: 2, phases: SQUAT_PHASES, restSec: 90 }),
        ex('bs_isolation',      { sets: 2, repReps: 8, repHoldSec: 5, restSec: 60 }),
        ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
      ]
    }
    if (phase === 2) {
      return [
        ex('squat_integration', { sets: 2, phases: SQUAT_PHASES, restSec: 90 }),
        ex('reverse_kegel',     { sets: 3, reps: 8, restSec: 45 }),
      ]
    }
    // phase 3 deload
    return [
      ex('squat_integration_dynamic', { sets: 2, reps: 8, restSec: 90 }),
      ex('bs_isolation',              { sets: 2, repReps: 8, repHoldSec: 8, restSec: 60 }),
      ex('reverse_kegel',             { sets: 3, reps: 8, restSec: 45 }),
    ]
  }

  if (phase === 1) {
    return [
      ex('squat_integration_dynamic', { sets: 3, reps: 8, restSec: 90 }),
      ex('bs_isolation',              { sets: 3, repReps: 10, repHoldSec: 5, restSec: 60 }),
      ex('reverse_kegel',             { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  if (phase === 2) {
    return [
      ex('squat_integration_dynamic', { sets: 4, reps: 10, restSec: 90 }),
      ex('bs_isolation',              { sets: 3, repReps: 10, repHoldSec: 8, restSec: 60 }),
      ex('reverse_kegel',             { sets: 3, reps: 8, restSec: 45 }),
    ]
  }
  // phase 3
  return [
    ex('squat_integration_dynamic', { sets: 4, reps: 12, restSec: 90 }),
    ex('bs_isolation',              { sets: 4, repReps: 10, repHoldSec: 10, restSec: 60 }),
    ex('reverse_kegel',             { sets: 4, reps: 10, restSec: 45 }),
  ]
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getSessionPlan(sessionType: SessionType, state: ProgramState): SessionPlan {
  if (state.status === 'completed') return { sessionType, exercises: [] }

  const { cycle, phase, isDeload } = state
  let exercises: Exercise[]

  if (cycle === 1) {
    if (sessionType === 'session_a') exercises = c1SessionA(phase, isDeload)
    else if (sessionType === 'session_b') exercises = c1SessionB(phase, isDeload)
    else exercises = c1SessionC(phase, isDeload)
  } else {
    if (sessionType === 'session_a') exercises = c2SessionA(phase, isDeload)
    else if (sessionType === 'session_b') exercises = c2SessionB(phase, isDeload)
    else exercises = c2SessionC(phase, isDeload)
  }

  return { sessionType, exercises }
}

export function estimateDurationSec(exercises: Exercise[]): number {
  return exercises.reduce((total, ex) => {
    let setWorkSec = 0
    if (ex.reps !== undefined) {
      setWorkSec = ex.reps * 3  // ~3s per rep
    } else if (ex.repReps !== undefined && ex.repHoldSec !== undefined) {
      setWorkSec = ex.repReps * (ex.repHoldSec + (ex.repRestSec ?? ex.repHoldSec))
    } else if (ex.phases) {
      setWorkSec = ex.phases.reduce((s, p) => {
        if (p.type === 'reps') return s + p.reps * 3
        return s + p.reps * ((p.holdSec ?? 5) + 3)
      }, 0)
    }
    return total + ex.sets * (setWorkSec + ex.restSec)
  }, 0)
}
