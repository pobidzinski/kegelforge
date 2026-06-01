'use client'

import Link from 'next/link'
import { getSessionPlan, estimateDurationSec, type ProgramState, type SessionType } from '@/lib/program'

const SESSION_CONFIG: Record<SessionType, { label: string; goal: string; icon: string }> = {
  session_a: { label: 'Sesja A', goal: 'Siła i eksplozja — Type II', icon: '⚡' },
  session_b: { label: 'Sesja B', goal: 'Wytrzymałość i downtraining', icon: '🔋' },
  session_c: { label: 'Sesja C', goal: 'Integracja neuromięśniowa', icon: '🎯' },
}

const SESSION_TYPES: SessionType[] = ['session_a', 'session_b', 'session_c']

interface Props {
  programState: ProgramState
  completedThisWeek: Set<string>
  lastSessionTime: Date | null
}

function exerciseSummary(plan: ReturnType<typeof getSessionPlan>): string {
  return plan.exercises
    .map((ex) => {
      if (ex.phases) return `${ex.sets}× sekwencja`
      if (ex.repReps && ex.repHoldSec) return `${ex.sets}×${ex.repReps}×${ex.repHoldSec}s`
      if (ex.reps) return `${ex.sets}×${ex.reps}r`
      return `${ex.sets}s`
    })
    .join(' · ')
}

export default function WeeklySessionCards({ programState, completedThisWeek, lastSessionTime }: Props) {
  const now = Date.now()
  const msSinceLastSession = lastSessionTime ? now - lastSessionTime.getTime() : Infinity
  const restNeeded = msSinceLastSession < 24 * 60 * 60 * 1000

  return (
    <div className="flex flex-col gap-3">
      {SESSION_TYPES.map((type) => {
        const plan = getSessionPlan(type, programState)
        const cfg = SESSION_CONFIG[type]
        const completed = completedThisWeek.has(type)
        const unavailable = !completed && restNeeded
        const timeMin = Math.ceil(estimateDurationSec(plan.exercises) / 60)

        const borderColor = completed
          ? 'border-emerald-500/40'
          : unavailable
          ? 'border-zinc-800 opacity-60'
          : 'border-zinc-800 hover:border-zinc-700'

        return (
          <Link
            key={type}
            href={unavailable || completed ? '#' : `/session/${type}`}
            onClick={(e) => { if (unavailable || completed) e.preventDefault() }}
            className={`block bg-zinc-900 rounded-2xl p-5 border transition-all ${borderColor} ${
              !unavailable && !completed ? 'active:scale-[0.98]' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                    completed ? 'bg-emerald-500/15' : 'bg-zinc-800'
                  }`}
                >
                  {cfg.icon}
                </div>
                <div>
                  <p className="font-semibold text-base leading-tight">{cfg.label}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{cfg.goal}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {completed ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    Ukończona
                  </span>
                ) : unavailable ? (
                  <span className="text-zinc-600 text-xs text-right">Odpocznij<br />24h</span>
                ) : (
                  <span className="text-zinc-600 text-sm">Do zrobienia</span>
                )}
                {!unavailable && !completed && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-700">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-xs">
                {plan.exercises.length} ćw. · ~{timeMin} min
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {plan.exercises.map((ex, i) => (
                <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">
                  {ex.phases
                    ? `${ex.sets}× sekw.`
                    : ex.repReps && ex.repHoldSec
                    ? `${ex.sets}×${ex.repReps}×${ex.repHoldSec}s`
                    : `${ex.sets}×${ex.reps}r`}
                </span>
              ))}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
