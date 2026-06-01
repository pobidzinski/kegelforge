'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProgramState } from '@/lib/program'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDatePL(isoDate: string): string {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── First-run screen ──────────────────────────────────────────────────────────

function FirstRunScreen({ onSaved }: { onSaved: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error: err } = await supabase.from('program_config').upsert({ id: 1, start_date: date })
    if (err) { setError('Nie udało się zapisać. Spróbuj ponownie.'); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-16 pb-8">
      <div className="mb-10">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
          <span className="text-2xl">💪</span>
        </div>
        <h1 className="text-3xl font-bold mb-3">Witaj w KegelForge</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Podaj datę startu programu. Możesz wpisać datę wsteczną, jeśli już ćwiczysz — aplikacja
          obliczy aktualny cykl, fazę i tydzień automatycznie.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
        <p className="text-xs text-zinc-500 mb-2">Program trwa <span className="text-zinc-300 font-medium">24 tygodnie</span> (2 cykle × 12 tygodni).</p>
        <p className="text-xs text-zinc-500">3 sesje tygodniowo (A, B, C) · Wymagana przerwa min. 24h między sesjami.</p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <label className="text-xs text-zinc-500 uppercase tracking-widest">Data startu programu</label>
        <input
          type="date" value={date} max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="mt-auto">
        <button
          onClick={handleSave} disabled={saving || !date}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-2xl transition-colors"
        >
          {saving ? 'Zapisywanie…' : 'Rozpocznij program'}
        </button>
      </div>
    </div>
  )
}

// ─── Settings screen ───────────────────────────────────────────────────────────

interface Config { start_date: string }
type ModalState = 'none' | 'change-date' | 'reset-confirm'

function SettingsScreen({ config, onUpdated }: { config: Config; onUpdated: () => void }) {
  const [modal, setModal] = useState<ModalState>('none')
  const [newDate, setNewDate] = useState(config.start_date)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const state = getProgramState(new Date(config.start_date))

  const handleChangeDate = async () => {
    setSaving(true); setError('')
    const { error: err } = await supabase.from('program_config').update({ start_date: newDate }).eq('id', 1)
    if (err) { setError('Nie udało się zaktualizować daty.'); setSaving(false); return }
    setModal('none'); setSaving(false); onUpdated()
  }

  const handleReset = async () => {
    setSaving(true); setError('')
    await supabase.from('sets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error: err } = await supabase.from('program_config').update({ start_date: todayISO() }).eq('id', 1)
    if (err) { setError('Nie udało się zresetować programu.'); setSaving(false); return }
    setModal('none'); setSaving(false); onUpdated()
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-8">
      <h1 className="text-2xl font-bold mb-1">Ustawienia</h1>
      <p className="text-zinc-500 text-sm mb-8">Konfiguracja programu</p>

      {/* Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <p className="text-xs text-zinc-500 mb-1">3 sesje tygodniowo (A, B, C)</p>
        <p className="text-xs text-zinc-600">Wymagana przerwa min. 24h między sesjami</p>
      </div>

      {/* Program info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 mb-4">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Data startu</span>
          <span className="text-sm font-medium">{formatDatePL(config.start_date)}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Postęp programu</span>
          <span className="text-sm font-medium">
            Tydzień {state.weekOverall} / 24
          </span>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Aktualny cykl</span>
          <span className="text-sm font-medium">Cykl {state.cycle}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Aktualna faza</span>
          <span className="text-sm font-medium">Faza {state.phase}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-zinc-400">Tydzień w fazie</span>
          <span className="text-sm font-medium flex items-center gap-2">
            Tydzień {state.weekInPhase}
            {state.isDeload && (
              <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">
                DELOAD
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mb-4">
        <button
          onClick={() => { setNewDate(config.start_date); setModal('change-date') }}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm py-4 rounded-2xl transition-colors"
        >
          Zmień datę startu
        </button>
        <button
          onClick={() => setModal('reset-confirm')}
          className="w-full bg-red-900/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 font-medium text-sm py-4 rounded-2xl transition-colors"
        >
          Resetuj cały program
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Wersja</span>
          <span className="text-sm text-zinc-600">0.2.0</span>
        </div>
      </div>

      {/* Modal: change date */}
      {modal === 'change-date' && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full">
            <h2 className="text-lg font-bold mb-1">Zmień datę startu</h2>
            <p className="text-zinc-500 text-sm mb-5">
              Zmiana daty przelicza aktualny cykl, fazę i tydzień. Historia sesji pozostaje bez zmian.
            </p>
            <input
              type="date" value={newDate} max={todayISO()}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-emerald-500 transition-colors mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setModal('none'); setError('') }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3.5 rounded-xl transition-colors">
                Anuluj
              </button>
              <button onClick={handleChangeDate} disabled={saving || !newDate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors">
                {saving ? 'Zapisuję…' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: reset */}
      {modal === 'reset-confirm' && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full">
            <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-1">Resetuj program?</h2>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
              Cała historia sesji zostanie trwale usunięta. Data startu zostanie ustawiona na dzisiaj. Tej operacji nie można cofnąć.
            </p>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setModal('none'); setError('') }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3.5 rounded-xl transition-colors">
                Anuluj
              </button>
              <button onClick={handleReset} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors">
                {saving ? 'Resetuję…' : 'Tak, resetuj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const [config, setConfig] = useState<Config | null | 'loading'>('loading')

  const load = async () => {
    const { data } = await supabase.from('program_config').select('start_date').eq('id', 1).maybeSingle()
    setConfig(data ?? null)
  }

  useEffect(() => { load() }, [])

  if (config === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  if (config === null) return <FirstRunScreen onSaved={() => router.replace('/')} />
  return <SettingsScreen config={config} onUpdated={load} />
}
