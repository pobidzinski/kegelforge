'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProgramState } from '@/lib/program'

interface SessionRow {
  id: string
  session_date: string
  session_type: string
  phase: number
  week_in_phase: number
  is_deload: boolean
  cycle: number
  duration_sec: number | null
}

const SESSION_LABELS: Record<string, string> = {
  session_a: 'Sesja A · Siła i eksplozja',
  session_b: 'Sesja B · Wytrzymałość',
  session_c: 'Sesja C · Integracja',
  // legacy
  morning: 'Rano',
  midday: 'Południe',
  evening: 'Wieczór',
}

const SESSION_ICONS: Record<string, string> = {
  session_a: '⚡',
  session_b: '🔋',
  session_c: '🎯',
  morning: '🌅',
  midday: '☀️',
  evening: '🌙',
}

function formatDate(isoDate: string) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

function formatDuration(sec: number | null) {
  if (!sec || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function toISODate(d: Date) { return d.toISOString().split('T')[0] }

/** Compute week number (1-based) relative to startDate */
function programWeek(sessionDate: string, startDate: Date): number {
  const d = new Date(sessionDate + 'T12:00:00')
  const diff = Math.floor((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return diff + 1
}

/** Consecutive weeks (ending now) with ≥2 sessions */
function computeWeekStreak(sessionsByWeek: Map<number, number>, currentWeek: number): number {
  let streak = 0
  // Start from current week; if <2 sessions, try from previous
  const start = (sessionsByWeek.get(currentWeek) ?? 0) >= 2 ? currentWeek : currentWeek - 1
  for (let w = start; w >= 1; w--) {
    if ((sessionsByWeek.get(w) ?? 0) >= 2) streak++
    else break
  }
  return streak
}

function getThisWeekMonday() {
  const today = new Date()
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - day)
  monday.setHours(0, 0, 0, 0)
  return monday
}

interface HeatCell { week: number; count: number }

function WeekCell({ cell, currentWeek }: { cell: HeatCell; currentWeek: number }) {
  const bg =
    cell.count === 0 ? 'bg-zinc-800'
    : cell.count === 1 ? 'bg-emerald-800'
    : cell.count === 2 ? 'bg-emerald-600'
    : 'bg-emerald-400'
  const isCurrent = cell.week === currentWeek

  return (
    <div
      title={`Tydzień ${cell.week}: ${cell.count} sesji`}
      className={`aspect-square rounded-sm ${bg} ${isCurrent ? 'ring-1 ring-white/40' : ''}`}
    />
  )
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: config }, { data: sessionData }] = await Promise.all([
        supabase.from('program_config').select('start_date').eq('id', 1).single(),
        supabase
          .from('sessions')
          .select('id,session_date,session_type,phase,week_in_phase,is_deload,cycle,duration_sec')
          .order('session_date', { ascending: false })
          .order('completed_at', { ascending: false }),
      ])

      if (config) setStartDate(new Date(config.start_date))
      setSessions(sessionData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  // Compute program state
  const programState = startDate ? getProgramState(startDate) : null
  const currentWeek = programState?.weekOverall ?? 1

  // Group by program week
  const sessionsByWeek = new Map<number, number>()
  if (startDate) {
    for (const s of sessions) {
      const w = programWeek(s.session_date, startDate)
      if (w >= 1 && w <= 24) {
        sessionsByWeek.set(w, (sessionsByWeek.get(w) ?? 0) + 1)
      }
    }
  }

  const weekStreak = computeWeekStreak(sessionsByWeek, currentWeek)

  // This week sessions
  const monday = getThisWeekMonday()
  const mondayISO = toISODate(monday)
  const thisWeekCount = sessions.filter((s) => s.session_date >= mondayISO).length

  // Build 24-week heatmap
  const heatmap: HeatCell[] = Array.from({ length: 24 }, (_, i) => ({
    week: i + 1,
    count: sessionsByWeek.get(i + 1) ?? 0,
  }))

  const recent = sessions.slice(0, 14)

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-8">
      <h1 className="text-2xl font-bold mb-1">Historia</h1>
      <p className="text-zinc-500 text-sm mb-6">Twoje poprzednie sesje</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Seria tygodniowa</p>
          <p className="text-3xl font-bold tabular-nums">
            {weekStreak}
            <span className="text-2xl ml-1">🔥</span>
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            {weekStreak === 1 ? 'tydzień z rzędu' : 'tygodnie z rzędu'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Ten tydzień</p>
          <p className="text-3xl font-bold tabular-nums">{thisWeekCount}</p>
          <p className="text-zinc-600 text-xs mt-1">z 3 sesji</p>
        </div>
      </div>

      {/* 24-week heatmap */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Program — 24 tygodnie</p>

        {/* Cycle 1 */}
        <p className="text-xs text-zinc-600 mb-2">Cykl 1</p>
        <div className="grid grid-cols-12 gap-1 mb-3">
          {heatmap.slice(0, 12).map((cell) => (
            <WeekCell key={cell.week} cell={cell} currentWeek={currentWeek} />
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-zinc-700 mb-3" />

        {/* Cycle 2 */}
        <p className="text-xs text-zinc-600 mb-2">Cykl 2</p>
        <div className="grid grid-cols-12 gap-1">
          {heatmap.slice(12, 24).map((cell) => (
            <WeekCell key={cell.week} cell={cell} currentWeek={currentWeek} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-zinc-600 text-xs">0</span>
          <div className="w-3 h-3 rounded-sm bg-zinc-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-zinc-600 text-xs">3</span>
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Ostatnie sesje</p>
        {recent.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">Brak sesji. Czas na pierwszy trening!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{SESSION_ICONS[s.session_type] ?? '📋'}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">
                      {SESSION_LABELS[s.session_type] ?? s.session_type}
                      {s.is_deload && <span className="ml-2 text-xs text-amber-400">DELOAD</span>}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      Cykl {s.cycle ?? 1}, Faza {s.phase}, tydz. {s.week_in_phase}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">{formatDate(s.session_date)}</p>
                  <p className="text-xs text-zinc-600 tabular-nums">{formatDuration(s.duration_sec)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
