'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface SessionRow {
  id: string
  session_type: string
  phase: number
  week_in_phase: number
  is_deload: boolean
  duration_sec: number | null
  session_date: string
}

interface SetRow {
  exercise_key: string
  set_number: number
  reps: number | null
  hold_sec: number | null
  completed: boolean
}

const EXERCISE_NAMES: Record<string, string> = {
  type2_hold: 'Spięcia z trzymaniem (Typ II)',
  power_flutter: 'Szybkie uderzenia (Power)',
  type1_endurance: 'Długie trzymanie (Typ I)',
}

const SESSION_LABELS: Record<string, string> = {
  morning: 'Rano',
  midday: 'Południe',
  evening: 'Wieczór',
}

function formatDuration(sec: number | null): string {
  if (!sec || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function groupSetsByExercise(sets: SetRow[]): { key: string; count: number }[] {
  const map = new Map<string, number>()
  for (const s of sets) {
    map.set(s.exercise_key, (map.get(s.exercise_key) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([key, count]) => ({ key, count }))
}

function SummaryContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [session, setSession] = useState<SessionRow | null>(null)
  const [sets, setSets] = useState<SetRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    async function load() {
      const [{ data: sessionData }, { data: setsData }] = await Promise.all([
        supabase
          .from('sessions')
          .select('id,session_type,phase,week_in_phase,is_deload,duration_sec,session_date')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('sets')
          .select('exercise_key,set_number,reps,hold_sec,completed')
          .eq('session_id', sessionId)
          .order('set_number', { ascending: true }),
      ])

      setSession(sessionData ?? null)
      setSets(setsData ?? [])
      setLoading(false)
    }

    load()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  const exerciseGroups = groupSetsByExercise(sets)

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-emerald-400"
          >
            <path
              fillRule="evenodd"
              d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">Sesja ukończona ✓</h1>
        {session && (
          <p className="text-zinc-500 text-sm">
            {SESSION_LABELS[session.session_type]} · Faza {session.phase}, tydzień{' '}
            {session.week_in_phase}
            {session.is_deload && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">
                DELOAD
              </span>
            )}
          </p>
        )}
      </div>

      {/* Stats card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
        <div className="flex justify-between items-center py-2.5 border-b border-zinc-800">
          <span className="text-zinc-400 text-sm">Czas trwania</span>
          <span className="font-semibold tabular-nums">
            {formatDuration(session?.duration_sec ?? null)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2.5 border-b border-zinc-800">
          <span className="text-zinc-400 text-sm">Ukończonych serii</span>
          <span className="font-semibold">{sets.filter((s) => s.completed).length}</span>
        </div>
        <div className="flex justify-between items-center py-2.5">
          <span className="text-zinc-400 text-sm">Ćwiczeń</span>
          <span className="font-semibold">{exerciseGroups.length}</span>
        </div>
      </div>

      {/* Exercise breakdown */}
      {exerciseGroups.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Ćwiczenia</p>
          <div className="flex flex-col gap-3">
            {exerciseGroups.map(({ key, count }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">
                  {EXERCISE_NAMES[key] ?? key}
                </span>
                <span className="text-sm font-medium text-zinc-400">{count} serii</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4">
        <Link
          href="/"
          className="block w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-base py-4 rounded-2xl transition-colors text-center"
        >
          Wróć do ekranu głównego
        </Link>
      </div>
    </div>
  )
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
        </div>
      }
    >
      <SummaryContent />
    </Suspense>
  )
}
