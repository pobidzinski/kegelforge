'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SessionRow {
  id: string
  session_date: string
  session_type: 'morning' | 'midday' | 'evening'
  phase: number
  week_in_phase: number
  is_deload: boolean
  duration_sec: number | null
}

const SESSION_LABELS: Record<string, string> = {
  morning: 'Rano',
  midday: 'Południe',
  evening: 'Wieczór',
}

const SESSION_ICONS: Record<string, string> = {
  morning: '🌅',
  midday: '☀️',
  evening: '🌙',
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

function formatDuration(sec: number | null): string {
  if (!sec || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Count consecutive days with ≥1 session ending today or yesterday */
function computeStreak(sessionsByDate: Map<string, number>): number {
  let streak = 0
  const today = new Date()

  // Start from today; if today has no session, start from yesterday
  const startOffset = sessionsByDate.has(toISODate(today)) ? 0 : 1

  for (let i = startOffset; ; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (sessionsByDate.has(toISODate(d))) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/** Count sessions in current Mon–Sun week */
function countThisWeek(sessions: SessionRow[]): number {
  const today = new Date()
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1 // Mon=0
  const monday = new Date(today)
  monday.setDate(today.getDate() - day)
  monday.setHours(0, 0, 0, 0)

  return sessions.filter((s) => new Date(s.session_date + 'T12:00:00') >= monday).length
}

/** Build last N days array with session counts */
function buildHeatmap(
  sessionsByDate: Map<string, number>,
  days: number,
): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = toISODate(d)
    result.push({ date: key, count: sessionsByDate.get(key) ?? 0 })
  }
  return result
}

function HeatmapCell({ count, date }: { count: number; date: string }) {
  const isToday = date === toISODate(new Date())
  const bg =
    count === 0
      ? 'bg-zinc-800'
      : count >= 3
      ? 'bg-emerald-400'
      : 'bg-emerald-600'

  return (
    <div
      title={`${formatDate(date)}: ${count} sesji`}
      className={`aspect-square rounded-sm ${bg} ${isToday ? 'ring-1 ring-white/30' : ''}`}
    />
  )
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sessions')
        .select('id,session_date,session_type,phase,week_in_phase,is_deload,duration_sec')
        .order('session_date', { ascending: false })
        .order('completed_at', { ascending: false })

      setSessions(data ?? [])
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

  // Aggregate by date
  const sessionsByDate = new Map<string, number>()
  for (const s of sessions) {
    sessionsByDate.set(s.session_date, (sessionsByDate.get(s.session_date) ?? 0) + 1)
  }

  const streak = computeStreak(sessionsByDate)
  const thisWeekCount = countThisWeek(sessions)
  const heatmap = buildHeatmap(sessionsByDate, 35) // 5 weeks = 35 days
  const recent = sessions.slice(0, 14)

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-8">
      <h1 className="text-2xl font-bold mb-1">Historia</h1>
      <p className="text-zinc-500 text-sm mb-6">Twoje poprzednie sesje</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Seria</p>
          <p className="text-3xl font-bold tabular-nums">
            {streak}
            <span className="text-2xl ml-1">🔥</span>
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            {streak === 1 ? 'dzień z rzędu' : streak >= 2 && streak <= 4 ? 'dni z rzędu' : 'dni z rzędu'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Ten tydzień</p>
          <p className="text-3xl font-bold tabular-nums">{thisWeekCount}</p>
          <p className="text-zinc-600 text-xs mt-1">z 18 możliwych</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Ostatnie 5 tygodni</p>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d) => (
            <p key={d} className="text-center text-zinc-600 text-xs">{d}</p>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1">
          {heatmap.map((cell) => (
            <HeatmapCell key={cell.date} count={cell.count} date={cell.date} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-zinc-600 text-xs">Brak</span>
          <div className="w-3 h-3 rounded-sm bg-zinc-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-zinc-600 text-xs">3+</span>
        </div>
      </div>

      {/* Recent sessions list */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Ostatnie sesje</p>

        {recent.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">
            Brak sesji. Czas na pierwszy trening!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{SESSION_ICONS[s.session_type]}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">
                      {SESSION_LABELS[s.session_type]}
                      {s.is_deload && (
                        <span className="ml-2 text-xs text-amber-400">DELOAD</span>
                      )}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      Faza {s.phase}, tydz. {s.week_in_phase}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">{formatDate(s.session_date)}</p>
                  <p className="text-xs text-zinc-600 tabular-nums">
                    {formatDuration(s.duration_sec)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
