'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

interface Props {
  startDate: string
}

export default function ProgramCompleteScreen({ startDate }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [stats, setStats] = useState<{ count: number; totalSec: number } | null>(null)

  // Calculate program end date (start + 24 weeks)
  const endDate = new Date(startDate + 'T12:00:00')
  endDate.setDate(endDate.getDate() + 24 * 7)
  const endDateISO = endDate.toISOString().split('T')[0]

  useEffect(() => {
    supabase
      .from('sessions')
      .select('duration_sec')
      .then(({ data }) => {
        if (!data) return
        setStats({
          count: data.length,
          totalSec: data.reduce((s, r) => s + (r.duration_sec ?? 0), 0),
        })
      })
  }, [])

  const handleReset = async () => {
    setResetting(true)
    await supabase.from('sets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('program_config').update({ start_date: todayISO() }).eq('id', 1)
    router.replace('/')
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">🏆</span>
        </div>
        <h1 className="text-2xl font-bold text-emerald-400 mb-2">Program ukończony</h1>
        <p className="text-zinc-400 text-sm">24 tygodnie — gotowe!</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 mb-4">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Start programu</span>
          <span className="text-sm font-medium">{formatDate(startDate)}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Ukończenie</span>
          <span className="text-sm font-medium">{formatDate(endDateISO)}</span>
        </div>
        {stats && (
          <>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-zinc-400">Łączna liczba sesji</span>
              <span className="text-sm font-bold text-emerald-400">{stats.count}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-zinc-400">Łączny czas treningu</span>
              <span className="text-sm font-bold text-emerald-400">{formatDuration(stats.totalSec)}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base py-4 rounded-2xl transition-colors"
        >
          Zacznij od nowa
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full">
            <h2 className="text-lg font-bold mb-2">Zacząć od nowa?</h2>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
              Cała historia sesji zostanie usunięta. Data startu zostanie ustawiona na dzisiaj. Operacji nie można cofnąć.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3.5 rounded-xl transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {resetting ? 'Resetuję…' : 'Tak, zacznij'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
