'use client'

interface Props {
  onContinue: () => void
}

export default function MyofascialNote({ onContinue }: Props) {
  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-8">
      <div className="mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Uzupełnij sesję</h1>
        <p className="text-emerald-400 text-sm font-medium">Myofascial Release — 5–7 min</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Potrzebujesz</p>
          <p className="text-sm text-zinc-300">Twardej piłki (lacrosse, tenisowa, golfowa).</p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {[
            'Połóż piłkę na podłodze.',
            'Usiądź tak, żeby piłka znalazła się po wewnętrznej stronie guza kulszowego (kość, na której siedzisz) — jedna strona na raz.',
            'Przenoś ciężar milimetrowymi ruchami szukając bolesnych, twardych punktów.',
            'Gdy znajdziesz punkt: zatrzymaj się. Statyczny ucisk 60–90 sekund bez ruchów.',
            'Prawidłowy sygnał: ból promieniujący do krocza, nasady lub jąder — to właściwy punkt, nie przerywaj.',
            'Powtórz po drugiej stronie.',
          ].map((step, i) => (
            <div key={i} className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Docelowe obszary</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Wewnętrzna strona guza kulszowego, głęboka część pośladka (mięsień gruszkowaty), wewnętrzna strona ud (przywodziciele).
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-5">
        <button
          onClick={onContinue}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-4 rounded-2xl transition-colors text-sm"
        >
          POMIŃ
        </button>
        <button
          onClick={onContinue}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-colors text-sm"
        >
          GOTOWE
        </button>
      </div>
    </div>
  )
}
