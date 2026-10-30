"use client"
import { useEffect, useState } from 'react'
const { createClient } = require('@supabase/supabase-js')

export default function Preparation() {
  const [lines, setLines] = useState([])
  const [supa, setSupa] = useState(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupa(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    }
  }, [])

  useEffect(() => {
    if (supa) {
      supa.from('amc_prep_lines').select('*').then(({ data }) => setLines(data || []))
    }
  }, [supa])

  const items = ['pantalons', 'pulls', 'pyjamas', 'peignoirs', 'djellaba_f', 'djellaba_h', 'jackets', 'manteaux', 'chales', 'livres']

  const handleChange = async (e) => {
    const id = e.target.getAttribute('data-prep')
    const field = e.target.getAttribute('data-field')
    const value = Number(e.target.value)
    if (id && field && supa) {
      const { error } = await supa.from('amc_prep_lines').upsert({ id, [field]: value, updated_at: new Date() }, { onConflict: 'id' })
      if (error) console.error(error)
    }
  }

  return (
    <div className="app min-h-screen" style={{ background: '#f6f7fb' }}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Préparation · AMC</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((it) => (
            <div key={it} className="card p-4">
              <h3 className="navy text-semibold mb-3">{it}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="muted text-sm">Déclaré</label>
                  <p className="text-2xl navy" id={`declared-${it}`}>0</p>
                </div>
                <div>
                  <label className="muted text-sm">Prêt</label>
                  <input data-prep={it} data-field="ready" type="number" min="0" className="border rounded px-3 py-2 w-full" /> pces
                </div>
                <div>
                  <label className="muted text-sm">Écarté</label>
                  <input data-prep={it} data-field="rejected" type="number" min="0" className="border rounded px-3 py-2 w-full" /> pces
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
