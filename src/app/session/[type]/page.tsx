'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  getProgramState,
  getSessionPlan,
  type Exercise,
  type SessionPlan,
  type ProgramState,
} from '@/lib/program'
import { useSessionStore } from '@/lib/sessionStore'

type SessionType = 'morning' | 'midday' | 'evening'

// ─── SVG Circle Timer ──────────────────────────────────────────────────────────

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircleTimer({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative flex items-center justify-center w-60 h-60">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="#10b981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <span className="text-6xl font-bold tabular-nums">{timeLeft}</span>
    </div>
  )
}

// ─── Timed Exercise View ───────────────────────────────────────────────────────

function TimedView({
  exercise,
  setIndex,
  onComplete,
}: {
  exercise: Exercise
  setIndex: number
  onComplete: () => void
}) {
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(exercise.holdSec!)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endTimeRef = useRef(0)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const playBeep = () => {
    try {
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }

  const handleStart = () => {
    // Create AudioContext during user gesture (required by browsers)
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtxRef.current = new Ctx()
      } catch {}
    }

    endTimeRef.current = Date.now() + exercise.holdSec! * 1000
    setStarted(true)

    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setTimeLeft(0)
        if (!doneRef.current) {
          doneRef.current = true
          playBeep()
          try { navigator.vibrate?.([200, 100, 200]) } catch {}
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current) onComplete()
          }, 400)
        }
      } else {
        setTimeLeft(remaining)
      }
    }, 100)
  }

  return (
    <div className="flex flex-col items-center flex-1 pt-2">
      <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">
        Seria {setIndex + 1} / {exercise.sets}
      </p>
      <h2 className="text-xl font-bold text-center mb-1 px-2">{exercise.name}</h2>
      <p className="text-zinc-400 text-sm text-center leading-relaxed px-4 mb-8">
        {exercise.description}
      </p>

      <div className="mb-10">
        {started ? (
          <CircleTimer timeLeft={timeLeft} totalTime={exercise.holdSec!} />
        ) : (
          <div className="relative flex items-center justify-center w-60 h-60">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#27272a" strokeWidth="5" />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={0}
              />
            </svg>
            <span className="text-5xl font-bold text-zinc-300">{exercise.holdSec}s</span>
          </div>
        )}
      </div>

      {!started && (
        <button
          onClick={handleStart}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
        >
          START
        </button>
      )}
    </div>
  )
}

// ─── Reps Exercise View ────────────────────────────────────────────────────────

function RepsView({
  exercise,
  setIndex,
  onComplete,
}: {
  exercise: Exercise
  setIndex: number
  onComplete: () => void
}) {
  return (
    <div className="flex flex-col items-center flex-1 pt-2">
      <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">
        Seria {setIndex + 1} / {exercise.sets}
      </p>
      <h2 className="text-xl font-bold text-center mb-1 px-2">{exercise.name}</h2>
      <p className="text-zinc-400 text-sm text-center leading-relaxed px-4 mb-8">
        {exercise.description}
      </p>

      <div className="flex-1 flex flex-col items-center justify-center mb-8">
        <span className="text-8xl font-bold text-emerald-400 tabular-nums">{exercise.reps}</span>
        <span className="text-zinc-400 text-xl mt-3">powtórzeń</span>
      </div>

      <button
        onClick={onComplete}
        className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
      >
        ZROBIONE ✓
      </button>
    </div>
  )
}

// ─── Rest View ─────────────────────────────────────────────────────────────────

function RestView({ restSec, onFinish }: { restSec: number; onFinish: () => void }) {
  const [timeLeft, setTimeLeft] = useState(restSec)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef(0)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    endTimeRef.current = Date.now() + restSec * 1000

    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setTimeLeft(0)
        if (!doneRef.current) {
          doneRef.current = true
          if (mountedRef.current) onFinish()
        }
      } else {
        setTimeLeft(remaining)
      }
    }, 100)

    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!doneRef.current) {
      doneRef.current = true
      onFinish()
    }
  }

  const progress = restSec > 0 ? timeLeft / restSec : 0

  return (
    <div className="flex flex-col flex-1 pt-4">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-zinc-500 text-sm mb-0.5">Przerwa</p>
          <p className="tabular-nums">
            <span className="text-5xl font-bold">{timeLeft}</span>
            <span className="text-xl text-zinc-500 ml-1.5">sek.</span>
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
        >
          POMIŃ
        </button>
      </div>

      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{ width: `${progress * 100}%`, transition: 'width 0.15s linear' }}
        />
      </div>

      <p className="text-zinc-600 text-sm text-center mt-8">Odpocznij i przygotuj się do następnej serii</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as SessionType

  const [plan, setPlan] = useState<SessionPlan | null>(null)
  const [programState, setProgramState] = useState<ProgramState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const store = useSessionStore()

  // Load config and initialise store once
  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: config } = await supabase
        .from('program_config')
        .select('start_date')
        .eq('id', 1)
        .single()

      if (cancelled) return

      if (!config) {
        router.replace('/')
        return
      }

      const state = getProgramState(new Date(config.start_date))
      const sessionPlan = getSessionPlan(type, state)

      setProgramState(state)
      setPlan(sessionPlan)
      store.initSession()
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for done → save → navigate
  useEffect(() => {
    if (store.phase !== 'done' || !programState || !plan || saving) return
    setSaving(true)

    async function save() {
      const today = new Date().toISOString().split('T')[0]
      const durationSec = store.sessionStartTime
        ? Math.floor((Date.now() - store.sessionStartTime.getTime()) / 1000)
        : null

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          session_date: today,
          session_type: type,
          phase: programState!.phase,
          week_in_phase: programState!.weekInPhase,
          is_deload: programState!.isDeload,
          duration_sec: durationSec,
        })
        .select('id')
        .single()

      if (error || !session) {
        router.replace('/summary')
        return
      }

      if (store.completedSets.length > 0) {
        await supabase.from('sets').insert(
          store.completedSets.map((s) => ({
            session_id: session.id,
            exercise_key: s.exerciseKey,
            set_number: s.setNumber,
            reps: s.reps ?? null,
            hold_sec: s.holdSec ?? null,
            completed: s.completed,
          }))
        )
      }

      router.push(`/summary?session_id=${session.id}`)
    }

    save()
  }, [store.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading / saving screens ───────────────────────────────────────────────

  if (loading || !plan || !programState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (store.phase === 'done' || saving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Zapisywanie sesji…</p>
      </div>
    )
  }

  // ── Session UI ─────────────────────────────────────────────────────────────

  const currentExercise = plan.exercises[store.currentExerciseIndex]
  const isTimed = currentExercise.holdSec !== undefined
  const totalExercises = plan.exercises.length

  const handleExerciseComplete = () => {
    store.recordSet({
      exerciseKey: currentExercise.key,
      setNumber: store.currentSetIndex + 1,
      reps: currentExercise.reps,
      holdSec: currentExercise.holdSec,
      completed: true,
    })
    store.goToRest()
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-8 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors -ml-1 p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">Wyjdź</span>
        </button>

        {/* Exercise progress dots */}
        <div className="flex items-center gap-1.5">
          {plan.exercises.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i < store.currentExerciseIndex
                  ? 'w-2 h-2 bg-emerald-500'
                  : i === store.currentExerciseIndex
                  ? 'w-3 h-3 bg-zinc-300'
                  : 'w-2 h-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Exercise or rest */}
      {store.phase === 'exercise' && isTimed && (
        <TimedView
          key={`${store.currentExerciseIndex}-${store.currentSetIndex}`}
          exercise={currentExercise}
          setIndex={store.currentSetIndex}
          onComplete={handleExerciseComplete}
        />
      )}

      {store.phase === 'exercise' && !isTimed && (
        <RepsView
          key={`${store.currentExerciseIndex}-${store.currentSetIndex}`}
          exercise={currentExercise}
          setIndex={store.currentSetIndex}
          onComplete={handleExerciseComplete}
        />
      )}

      {store.phase === 'rest' && (
        <RestView
          key={`rest-${store.currentExerciseIndex}-${store.currentSetIndex}`}
          restSec={currentExercise.restSec}
          onFinish={() => store.advanceSet(currentExercise.sets, totalExercises)}
        />
      )}
    </div>
  )
}
