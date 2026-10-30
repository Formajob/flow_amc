"use client"
import { useEffect, useState } from 'react'
const { createClient } = require('@supabase/supabase-js')

export default function Distribution() {
  const [supa, setSupa] = useState(null)
  const [dist, setDist] = useState({ households: 0, closed: false })

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupa(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    }
  }, [])

  // Load distribution state
  useEffect(() => {
    if (supa) {
      supa.from('amc_prep_lines').select('*').then(({ data }) => {
        setDist({ households: 0, closed: false })
      })
    }
  }, [supa])

  const handleHouseholds = async (e) => {
    const value = Number(e.target.value)
    if (supa) {
      const { error } = await supa.from('amc_entries').update({ note: `Ménages: ${value}` }).eq('id', 'some-id')
      if (error) console.error(error)
    }
    setDist({ ...dist, households: value })
  }

  const handleClose = async () => {
    if (supa) {
      const { error } = await supa.from('amc_entries').update({ distribution: { closed: true } })
      if (error) console.error(error)
    }
    setDist({ ...dist, closed: true })
  }

  const items = ['pantalons', 'pulls', 'pyjamas', 'peignoirs', 'djellaba_f', 'djellaba_h', 'jackets', 'manteaux', 'chales', 'livres']

  return (
    <div className="app min-h-screen" style={{ background: '#f6f7fb' }}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Distribution · AMC</h1>
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="muted text-sm">Nombre de foyers</label>
              <input type="number" value={dist.households} onChange={handleHouseholds} className="border rounded px-3 py-2 w-full" min="0" />
            </div>
            <div>
              <button onClick={handleClose} className="btn-navy py-2 px-6" disabled={dist.closed}>
                {dist.closed ? 'Distribution marquée terminée' : 'Marquer distribution terminée'}
              </button>
            </div>
          </div>
          <p className="mt-2 encre">Nombre de foyers seulement. Pas de fiche nominative.</p>
        </div>
      </div>
    </div>
  )
}
