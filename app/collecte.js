import Link from 'next/link'
import { useState } from 'react'
import supabase from '@supabase/supabase-js'

export default function Collecte() {
  const [form, setForm] = useState({
    group: '',
    member: '',
    item: '',
    qty: 0,
  })
  const [status, setStatus] = useState('')

  const supa = supabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const groups = ['A', 'B', 'C', 'D']
  const items = [
    'pantalons', 'pulls', 'pyjamas', 'peignoirs',
    'djellaba_f', 'djellaba_h', 'jackets', 'manteaux', 'chales', 'argent'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supa.from('amc_entries').insert({
      group_id: form.group,
      member_id: form.member,
      item_id: form.item,
      qty: form.qty,
      author: 'Saisie',
    })

    if (error) setStatus('Erreur: ' + error.message)
    else {
      setStatus('Saisie enregistrée')
      // Reset form
      setForm({ group: '', member: '', item: '', qty: 0 })
    }
  }

  // Load members when group changes
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (form.group) {
      // Fetch members for this group from Supabase
    }
  }, [form.group])

  return (
    <div className="app min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Collecte · AMC</h1>
        
        <form onSubmit={handleSubmit} className="card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="muted block mb-1">Groupe</label>
              <select
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="">Sélectionner</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    Groupe {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted block mb-1">Membre</label>
              <select
                value={form.member}
                onChange={(e) => setForm({ ...form, member: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="">Charger les membres</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="muted block mb-1">Type d'article</label>
              <select
                value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="">Sélectionner</option>
                {items.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted block mb-1">Quantité</label>
              <input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                className="border rounded px-3 py-2"
                min="-9999"
              /> pcs
            </div>
          </div>

          <button type="submit" className="btn-navy w-full py-2 mt-4">
            Enregistrer la saisie
          </button>

          {status && <p className="mt-3 cyan-d">{status}</p>}
        </form>
      </div>
    </div>
  )
}