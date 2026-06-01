'use client'

import { useState } from 'react'
import { EXERCISES } from '@/lib/exercises'
import type { Exercise } from '@/lib/program'

type Tab = 'how' | 'muscles' | 'mistakes'

interface Props {
  exercise: Exercise
  setIndex: number
  onStart: () => void
}

export default function ExerciseInfoCard({ exercise, setIndex, onStart }: Props) {
  const [tab, setTab] = useState<Tab>('how')
  const [dontShow, setDontShow] = useState(false)

  const def = EXERCISES.find((e) => e.key === exercise.key)

  const handleStart = () => {
    if (dontShow) {
      localStorage.setItem(`hideExerciseCard_${exercise.key}`, 'true')
    }
    onStart()
  }

  const paramLabel = () => {
    if (exercise.phases) return `${exercise.sets} serii sekwencji`
    if (exercise.repReps && exercise.repHoldSec)
      return `${exercise.sets} serie × ${exercise.repReps} powt. × ${exercise.repHoldSec}s`
    if (exercise.reps) return `${exercise.sets} serie × ${exercise.reps} powt.`
    return `${exercise.sets} serii`
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-8 pb-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2">
          Ćwiczenie {setIndex + 1}
        </p>
        <h1 className="text-2xl font-bold leading-tight mb-1">{exercise.name}</h1>
        <p className="text-zinc-500 text-sm">{paramLabel()} · przerwa {exercise.restSec}s</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-zinc-900 p-1 rounded-xl">
        {(['how', 'muscles', 'mistakes'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { how: 'Jak wykonać', muscles: 'Mięśnie', mistakes: 'Błędy' }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'how' && def && (
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Pozycja</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{def.position}</p>
            </div>
            <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl p-4">
              <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2">Wskazówka</p>
              <p className="text-sm text-zinc-200 leading-relaxed">{def.cue}</p>
            </div>
          </div>
        )}

        {tab === 'muscles' && def && (
          <div className="flex flex-col gap-4">
            {def.muscles.map((m) => (
              <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="font-semibold text-sm mb-1">{m.name}</p>
                <p className="text-zinc-400 text-sm leading-relaxed mb-3">{m.role}</p>
              </div>
            ))}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Jak poczuć</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{def.how_to_feel}</p>
            </div>
          </div>
        )}

        {tab === 'mistakes' && def && (
          <div className="flex flex-col gap-3">
            {def.common_mistakes.map((m, i) => (
              <div key={i} className="bg-zinc-900 border border-red-900/30 rounded-2xl p-4 flex gap-3">
                <div className="w-5 h-5 rounded-full border border-red-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-500 text-xs font-bold">✕</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="pt-5">
        <button
          onClick={handleStart}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-base py-4 rounded-2xl transition-colors mb-3"
        >
          ROZUMIEM, ZACZYNAM
        </button>
        <label className="flex items-center gap-2 justify-center cursor-pointer">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <span className="text-xs text-zinc-500">Nie pokazuj karty dla tego ćwiczenia</span>
        </label>
      </div>
    </div>
  )
}
