import Link from 'next/link'
import { useState } from 'react'
import supabase from '@supabase/supabase-js'

export default function Distribution() {
  const supa = supabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const items = [
    'pantalons', 'pulls', 'pyjamas', 'peignoirs',
    'djellaba_f', 'djellaba_h', 'jackets', 'manteaux', 'chales'
  ]

  const [dist, setDist] = useState({
    households: 0,
    closed: false,
  })

  // Load distribution state
  useEffect(() => {
    supa.from('amc_entries').select('qty, item_id').then(() => {
      // Get current distribution state
      supa.from('amc_prep_lines').select('*').then(({ data }) => {
        // Calculate taken from ready quantities
        let totalTaken = 0
        items.forEach(it => {
          const ready = data?.find(d => d.item_id === it)?.ready_qty || 0
          totalTaken += ready
        })

        setDist({
          households: 0,
          closed: false,
        })
      })
    })
  }, [])

  const handleHouseholds = async (e) => {
    const value = Number(e.target.value)
    const { error } = await supa.from('amc_entries').update({
      note: `Ménages: ${value}`
    }).eq('id', 'some-id') // This needs fixing

    if (error) console.error(error)
    setDist({ ...dist, households: value })
  }

  const handleClose = async () => {
    const { error } = await supa.from('amc_entries').update({
      distribution: { closed: true }
    })

    if (error) console.error(error)
    setDist({ ...dist, closed: true })
  }

  return (
    <div className="app min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Distribution · AMC</h1>

        <div className="card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="muted text-sm">Nombre de foyers</label>
              <input
                type="number"
                value={dist.households}
                onChange={(e) => handleHouseholds(e)}
                className="border rounded px-3 py-2 w-full"
                min="0"
              />
            </div>
            <div>
              <button
                onClick={handleClose}
                className="btn-navy py-2 px-6"
                disabled={dist.closed}
              >
                {dist.closed ? 'Distribution marquée terminée' : 'Marquer distribution terminée'}
              </button>
            </div>
          </div>

          <p className="mt-2 encre">
            Nombre de foyers seulement. Pas de fiche nominative.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it} className="card p-4">
              <h3 className="navy text-semibold mb-3">{it}</h3>
              <p className="encre">Restant: <span id={`rest-${it}`}>0</span> pièces</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}