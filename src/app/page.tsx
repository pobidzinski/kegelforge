'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProgramState, type ProgramState } from '@/lib/program'
import WeeklySessionCards from '@/components/WeeklySessionCards'
import ProgramCompleteScreen from '@/components/ProgramCompleteScreen'

function getWeekBounds() {
  const today = new Date()
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1 // Mon=0
  const monday = new Date(today)
  monday.setDate(today.getDate() - day)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default function TodayPage() {
  const router = useRouter()
  const [programState, setProgramState] = useState<ProgramState | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [completedThisWeek, setCompletedThisWeek] = useState<Set<string>>(new Set())
  const [lastSessionTime, setLastSessionTime] = useState<Date | null>(null)
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

      setStartDate(config.start_date)
      const state = getProgramState(new Date(config.start_date))
      setProgramState(state)

      // Load this week's sessions
      const monday = getWeekBounds()
      const mondayISO = monday.toISOString().split('T')[0]

      const { data: sessions } = await supabase
        .from('sessions')
        .select('session_type, completed_at')
        .gte('session_date', mondayISO)
        .order('completed_at', { ascending: false })

      if (sessions) {
        setCompletedThisWeek(new Set(sessions.map((s) => s.session_type)))
        const latest = sessions[0]?.completed_at
        if (latest) setLastSessionTime(new Date(latest))
      }

      setLoading(false)
    }

    load()
  }, [router])

  if (loading || !programState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (programState.status === 'completed' && startDate) {
    return <ProgramCompleteScreen startDate={startDate} />
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Cykl {programState.cycle} · Faza {programState.phase}
          </h1>
          {programState.isDeload && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/30">
              DELOAD
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-sm">
          Tydzień {programState.weekInPhase} w fazie · Tydzień {programState.weekOverall} / 24
        </p>
      </div>

      <WeeklySessionCards
        programState={programState}
        completedThisWeek={completedThisWeek}
        lastSessionTime={lastSessionTime}
      />
    </div>
  )
}
