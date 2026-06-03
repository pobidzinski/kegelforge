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
  type SessionType,
} from '@/lib/program'
import { useSessionStore } from '@/lib/sessionStore'
import ExerciseInfoCard from '@/components/ExerciseInfoCard'
import MyofascialNote from '@/components/MyofascialNote'

// ─── Circle Timer ──────────────────────────────────────────────────────────────

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircleTimer({
  timeLeft,
  totalTime,
  mode = 'empty',
  color = '#10b981',
}: {
  timeLeft: number
  totalTime: number
  mode?: 'fill' | 'empty'
  color?: string
}) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0
  // 'fill': circle fills as time passes (dashOffset shrinks from CIRCUMFERENCE → 0)
  // 'empty': circle empties as time passes (dashOffset grows from 0 → CIRCUMFERENCE)
  const dashOffset = mode === 'fill'
    ? CIRCUMFERENCE * progress
    : CIRCUMFERENCE * (1 - progress)
  return (
    <div className="relative flex items-center justify-center w-60 h-60">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle
          cx="50" cy="50" r={RADIUS} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <span className="text-6xl font-bold tabular-nums">{timeLeft}</span>
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
        setTimeLeft(0)
        if (!doneRef.current) { doneRef.current = true; if (mountedRef.current) onFinish() }
      } else {
        setTimeLeft(remaining)
      }
    }, 100)

    async function scheduleNotification() {
      if (!('serviceWorker' in navigator) || !('Notification' in window)) return
      if (Notification.permission === 'default') await Notification.requestPermission()
      if (Notification.permission !== 'granted') return
      const sw = await navigator.serviceWorker.ready
      sw.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION', id: 'rest-timer', endTime: endTimeRef.current,
        title: 'KegelForge', body: 'Czas odpoczynku minął! Czas na kolejną serię 💪',
      })
    }
    scheduleNotification()

    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      navigator.serviceWorker?.ready
        .then((sw) => sw.active?.postMessage({ type: 'CANCEL_NOTIFICATION', id: 'rest-timer' }))
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!doneRef.current) { doneRef.current = true; onFinish() }
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
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
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

// ─── Reps View ─────────────────────────────────────────────────────────────────

function RepsView({
  exercise, setIndex, onComplete,
}: { exercise: Exercise; setIndex: number; onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center flex-1 pt-2">
      <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">
        Seria {setIndex + 1} / {exercise.sets}
      </p>
      <h2 className="text-xl font-bold text-center mb-1 px-2">{exercise.name}</h2>
      <p className="text-zinc-400 text-sm text-center leading-relaxed px-4 mb-8">{exercise.description}</p>
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

// ─── RepTimed View (N reps × M seconds each, auto-flow with rep rest) ─────────

function RepTimedView({
  exercise, setIndex, onComplete,
}: { exercise: Exercise; setIndex: number; onComplete: () => void }) {
  const totalReps = exercise.repReps!
  const holdSec = exercise.repHoldSec!
  const restSec = exercise.repRestSec ?? holdSec

  type Phase = 'idle' | 'exercise' | 'rest'
  const [phase, setPhase] = useState<Phase>('idle')
  const [repIndex, setRepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(holdSec)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef(0)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const playBeep = () => {
    try {
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(); osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }

  const startTimer = (durationSec: number, onExpire: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    endTimeRef.current = Date.now() + durationSec * 1000
    doneRef.current = false
    setTimeLeft(durationSec)
    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(intervalRef.current!); intervalRef.current = null
        setTimeLeft(0)
        if (!doneRef.current) { doneRef.current = true; onExpire() }
      } else {
        setTimeLeft(remaining)
      }
    }, 100)
  }

  const beginExerciseRep = (rep: number) => {
    setRepIndex(rep)
    setPhase('exercise')
    startTimer(holdSec, () => {
      playBeep()
      try { navigator.vibrate?.([100, 50, 100]) } catch {}
      setTimeout(() => {
        if (!mountedRef.current) return
        const nextRep = rep + 1
        if (nextRep >= totalReps) {
          onComplete()
        } else {
          beginRestPhase(nextRep)
        }
      }, 400)
    })
  }

  const beginRestPhase = (nextRep: number) => {
    setPhase('rest')
    startTimer(restSec, () => {
      playBeep()
      setTimeout(() => {
        if (!mountedRef.current) return
        beginExerciseRep(nextRep)
      }, 200)
    })
  }

  const handleStart = () => {
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtxRef.current = new Ctx()
      } catch {}
    }
    beginExerciseRep(0)
  }

  return (
    <div className="flex flex-col items-center flex-1 pt-2">
      <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">
        Seria {setIndex + 1} / {exercise.sets}
      </p>
      <h2 className="text-xl font-bold text-center mb-1 px-2">{exercise.name}</h2>
      <p className="text-zinc-400 text-sm text-center leading-relaxed px-4 mb-4">{exercise.description}</p>

      <p className="text-zinc-500 text-sm mb-6">
        {phase === 'rest' ? (
          <>Odpoczynek przed powt. <span className="text-amber-400 font-semibold">{repIndex + 2}</span></>
        ) : (
          <>Powtórzenie <span className="text-white font-semibold">{repIndex + 1}</span> / {totalReps}</>
        )}
      </p>

      <div className="mb-10">
        {phase === 'idle' && (
          <div className="relative flex items-center justify-center w-60 h-60">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#27272a" strokeWidth="5" />
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#10b981" strokeWidth="5"
                strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={0} />
            </svg>
            <span className="text-5xl font-bold text-zinc-300">{holdSec}s</span>
          </div>
        )}
        {phase === 'exercise' && (
          <CircleTimer timeLeft={timeLeft} totalTime={holdSec} mode="fill" color="#10b981" />
        )}
        {phase === 'rest' && (
          <CircleTimer timeLeft={timeLeft} totalTime={restSec} mode="empty" color="#f59e0b" />
        )}
      </div>

      {phase === 'idle' && (
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

// ─── Mixed Sequence View ───────────────────────────────────────────────────────

function MixedView({
  exercise, setIndex, onComplete,
}: { exercise: Exercise; setIndex: number; onComplete: () => void }) {
  const phases = exercise.phases!
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [repIdx, setRepIdx] = useState(0)
  const [holdStarted, setHoldStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef(0)
  const doneRef = useRef(false)
  const mountedRef = useRef(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    mountedRef.current = true
    if (phases[0]?.type === 'hold') setTimeLeft(phases[0].holdSec ?? 5)
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => {
    const currentPhase = phases[phaseIdx]
    const nextRep = repIdx + 1
    if (nextRep < currentPhase.reps) {
      setRepIdx(nextRep)
      setHoldStarted(false)
      if (currentPhase.type === 'hold') setTimeLeft(currentPhase.holdSec ?? 5)
      return
    }
    const nextPhase = phaseIdx + 1
    if (nextPhase < phases.length) {
      setPhaseIdx(nextPhase)
      setRepIdx(0)
      setHoldStarted(false)
      if (phases[nextPhase].type === 'hold') setTimeLeft(phases[nextPhase].holdSec ?? 5)
      return
    }
    onComplete()
  }

  const handleHoldStart = () => {
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audioCtxRef.current = new Ctx()
      } catch {}
    }
    const holdSec = phases[phaseIdx].holdSec ?? 5
    endTimeRef.current = Date.now() + holdSec * 1000
    doneRef.current = false
    setHoldStarted(true)

    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(intervalRef.current!); intervalRef.current = null
        setTimeLeft(0)
        if (!doneRef.current) {
          doneRef.current = true
          try { navigator.vibrate?.([100, 50, 100]) } catch {}
          setTimeout(() => { if (mountedRef.current) advance() }, 400)
        }
      } else {
        setTimeLeft(remaining)
      }
    }, 100)
  }

  const currentPhase = phases[phaseIdx]
  const holdSec = currentPhase.holdSec ?? 5

  return (
    <div className="flex flex-col items-center flex-1 pt-2">
      <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">
        Seria {setIndex + 1} / {exercise.sets}
      </p>
      <h2 className="text-xl font-bold text-center mb-1 px-2">{exercise.name}</h2>

      <div className="flex items-center gap-2 mb-6">
        {phases.map((p, i) => (
          <div key={i} className={`flex items-center gap-1`}>
            {i > 0 && <span className="text-zinc-600 text-xs mx-1">→</span>}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                i === phaseIdx
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : i < phaseIdx
                  ? 'bg-zinc-800 text-zinc-600 line-through'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {p.type === 'reps' ? `${p.reps}× szybkie` : `${p.reps}× ${p.holdSec}s`}
            </span>
          </div>
        ))}
      </div>

      <p className="text-zinc-500 text-sm mb-6">
        {currentPhase.type === 'reps' ? 'Quick Flicks' : 'Endurance Hold'} ·{' '}
        Powt. <span className="text-white font-semibold">{repIdx + 1}</span> / {currentPhase.reps}
      </p>

      {currentPhase.type === 'reps' ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center mb-8">
            <span className="text-8xl font-bold text-emerald-400 tabular-nums">{repIdx + 1}</span>
            <span className="text-zinc-400 text-xl mt-3">/ {currentPhase.reps}</span>
          </div>
          <button
            onClick={advance}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
          >
            ZROBIONE ✓
          </button>
        </>
      ) : (
        <div className="mb-10 flex flex-col items-center w-full">
          {holdStarted ? (
            <CircleTimer timeLeft={timeLeft} totalTime={holdSec} />
          ) : (
            <div className="relative flex items-center justify-center w-60 h-60">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#27272a" strokeWidth="5" />
                <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#10b981" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={0} />
              </svg>
              <span className="text-5xl font-bold text-zinc-300">{holdSec}s</span>
            </div>
          )}
          {!holdStarted && (
            <button
              onClick={handleHoldStart}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xl py-5 rounded-2xl transition-colors"
            >
              START
            </button>
          )}
        </div>
      )}
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

  // Info card state
  const [showInfoCard, setShowInfoCard] = useState(false)
  const infoCardExerciseRef = useRef(-1)

  // Post-session state
  const [showMyofascialNote, setShowMyofascialNote] = useState(false)
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null)
  const saveAttemptedRef = useRef(false)

  const store = useSessionStore()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: config } = await supabase
        .from('program_config').select('start_date').eq('id', 1).single()
      if (cancelled) return
      if (!config) { router.replace('/'); return }

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

  // Info card: check when exercise index changes
  useEffect(() => {
    if (!plan || store.phase !== 'exercise') return
    const idx = store.currentExerciseIndex
    if (idx === infoCardExerciseRef.current) return
    infoCardExerciseRef.current = idx
    const ex = plan.exercises[idx]
    const hide = typeof window !== 'undefined'
      ? localStorage.getItem(`hideExerciseCard_${ex.key}`) === 'true'
      : true
    setShowInfoCard(!hide)
  }, [store.currentExerciseIndex, store.phase, plan])

  // Save when done
  useEffect(() => {
    if (store.phase !== 'done' || !programState || !plan || saveAttemptedRef.current) return
    saveAttemptedRef.current = true
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
          cycle: programState!.cycle,
          duration_sec: durationSec,
        })
        .select('id').single()

      if (error || !session) {
        console.error('Błąd zapisu sesji:', error?.message, error?.details)
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
            muscle_target: s.muscleTarget ?? null,
            completed: s.completed,
          }))
        )
      }

      if (type === 'session_b') {
        setSavedSessionId(session.id)
        setShowMyofascialNote(true)
        setSaving(false)
      } else {
        router.push(`/summary?session_id=${session.id}`)
      }
    }
    save()
  }, [store.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (loading || !plan || !programState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (showMyofascialNote && savedSessionId) {
    return <MyofascialNote onContinue={() => router.push(`/summary?session_id=${savedSessionId}`)} />
  }

  if (store.phase === 'done' || saving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Zapisywanie sesji…</p>
      </div>
    )
  }

  // ── Session UI ────────────────────────────────────────────────────────────────

  const currentExercise = plan.exercises[store.currentExerciseIndex]
  const totalExercises = plan.exercises.length

  // Show info card for current exercise
  if (showInfoCard) {
    return (
      <ExerciseInfoCard
        exercise={currentExercise}
        setIndex={store.currentExerciseIndex}
        onStart={() => setShowInfoCard(false)}
      />
    )
  }

  const handleExerciseComplete = () => {
    store.recordSet({
      exerciseKey: currentExercise.key,
      setNumber: store.currentSetIndex + 1,
      reps: currentExercise.reps,
      holdSec: currentExercise.repHoldSec,
      muscleTarget: currentExercise.muscleTarget,
      completed: true,
    })
    store.goToRest()
  }

  const isMixed = !!currentExercise.phases
  const isRepTimed = !isMixed && !!currentExercise.repReps
  const isReps = !isMixed && !isRepTimed && currentExercise.reps !== undefined

  return (
    <div className="flex flex-col min-h-screen px-4 pt-8 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors -ml-1 p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Wyjdź</span>
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {plan.exercises.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${
              i < store.currentExerciseIndex ? 'w-2 h-2 bg-emerald-500'
              : i === store.currentExerciseIndex ? 'w-3 h-3 bg-zinc-300'
              : 'w-2 h-2 bg-zinc-700'
            }`} />
          ))}
        </div>
      </div>

      {store.phase === 'exercise' && isMixed && (
        <MixedView
          key={`${store.currentExerciseIndex}-${store.currentSetIndex}`}
          exercise={currentExercise}
          setIndex={store.currentSetIndex}
          onComplete={handleExerciseComplete}
        />
      )}

      {store.phase === 'exercise' && isRepTimed && (
        <RepTimedView
          key={`${store.currentExerciseIndex}-${store.currentSetIndex}`}
          exercise={currentExercise}
          setIndex={store.currentSetIndex}
          onComplete={handleExerciseComplete}
        />
      )}

      {store.phase === 'exercise' && isReps && (
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
