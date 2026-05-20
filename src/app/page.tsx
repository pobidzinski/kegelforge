'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProgramState, getSessionPlan, type ProgramState, type SessionPlan } from '@/lib/program'

type SessionType = 'morning' | 'midday' | 'evening'

const SESSION_LABELS: Record<SessionType, string> = {
  morning: 'Rano',
  midday: 'Południe',
  evening: 'Wieczór',
}

const SESSION_ICONS: Record<SessionType, string> = {
  morning: '🌅',
  midday: '☀️',
  evening: '🌙',
}

const SESSION_TYPES: SessionType[] = ['morning', 'midday', 'evening']

function estimateSec(plan: SessionPlan): number {
  return plan.exercises.reduce((total, ex) => {
    const workSec = ex.holdSec ? ex.sets * ex.holdSec : ex.sets * 30
    const restSec = ex.sets * ex.restSec
    return total + workSec + restSec
  }, 0)
}

export default function TodayPage() {
  const router = useRouter()
  const [state, setState] = useState<ProgramState | null>(null)
  const [completedTypes, setCompletedTypes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: config } = await supabase
        .from('program_config')
        .select('start_date')
        .eq('id', 1)
        .single()

      if (!config) {
        router.replace('/settings')
        return
      }

      setState(getProgramState(new Date(config.start_date)))

      const today = new Date().toISOString().split('T')[0]
      const { data: todaySessions } = await supabase
        .from('sessions')
        .select('session_type')
        .eq('session_date', today)

      setCompletedTypes(new Set(todaySessions?.map((s) => s.session_type) ?? []))
      setLoading(false)
    }

    load()
  }, [router])

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Faza {state.phase} · Tydzień {state.weekInPhase}
          </h1>
          {state.isDeload && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/30">
              DELOAD
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-sm">Tydzień {state.weekOverall} programu</p>
      </div>

      {/* Session cards */}
      <div className="flex flex-col gap-3">
        {SESSION_TYPES.map((type) => {
          const plan = getSessionPlan(type, state)
          const completed = completedTypes.has(type)
          const timeMin = Math.ceil(estimateSec(plan) / 60)

          return (
            <Link
              key={type}
              href={`/session/${type}`}
              className={`block bg-zinc-900 rounded-2xl p-5 border transition-all active:scale-[0.98] ${
                completed
                  ? 'border-emerald-500/40'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                      completed ? 'bg-emerald-500/15' : 'bg-zinc-800'
                    }`}
                  >
                    {SESSION_ICONS[type]}
                  </div>
                  <div>
                    <p className="font-semibold text-base leading-tight">
                      {SESSION_LABELS[type]}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {plan.exercises.length} ćw. · ~{timeMin} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {completed ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Ukończono
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-sm">Do zrobienia</span>
                  )}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-zinc-700 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Exercise pills */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {plan.exercises.map((ex, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full"
                  >
                    {ex.sets}×{ex.holdSec ? `${ex.holdSec}s` : `${ex.reps}r`}
                  </span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
