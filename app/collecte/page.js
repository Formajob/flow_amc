"use client"
import { useState, useEffect } from 'react'
const { createClient } = require('@supabase/supabase-js')

export default function Collecte() {
  const [form, setForm] = useState({ group: '', member: '', item: '', qty: 0 })
  const [status, setStatus] = useState('')
  const [members, setMembers] = useState([])
  const [supa, setSupa] = useState(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupa(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    }
  }, [])

  useEffect(() => {
    if (form.group && supa) {
      supa.from('amc_members').select('*').eq('group_id', form.group).then(({ data }) => {
        setMembers(data || [])
      })
    }
  }, [form.group, supa])

  const groups = ['A', 'B', 'C', 'D', 'E']
  const items = ['pantalons', 'pulls', 'pyjamas', 'peignoirs', 'djellaba_f', 'djellaba_h', 'jackets', 'manteaux', 'chales', 'livres', 'argent']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supa) { setStatus('Supabase non configuré'); return }
    const { error } = await supa.from('amc_entries').insert({
      group_id: form.group, member_id: form.member, item_id: form.item, qty: form.qty, author: 'Saisie'
    })
    if (error) setStatus('Erreur: ' + error.message)
    else { setStatus('Saisie enregistrée'); setForm({ group: '', member: '', item: '', qty: 0 }) }
  }

  return (
    <div className="app min-h-screen" style={{ background: '#f6f7fb' }}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Collecte · AMC</h1>
        <form onSubmit={handleSubmit} className="card p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="muted block mb-1">Groupe</label>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className="border rounded px-3 py-2 w-full">
                <option value="">Sélectionner</option>
                {groups.map((g) => <option key={g} value={g}>Groupe {g}</option>)}
              </select>
            </div>
            <div>
              <label className="muted block mb-1">Membre</label>
              <select value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} className="border rounded px-3 py-2 w-full">
                <option value="">Charger les membres</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="muted block mb-1">Type d'article</label>
              <select value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} className="border rounded px-3 py-2 w-full">
                <option value="">Sélectionner</option>
                {items.map((it) => <option key={it} value={it}>{it}</option>)}
              </select>
            </div>
            <div>
              <label className="muted block mb-1">Quantité</label>
              <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} className="border rounded px-3 py-2 w-full" min="-9999" /> pcs
            </div>
          </div>
          <button type="submit" className="btn-navy w-full py-2 mt-4">Enregistrer la saisie</button>
          {status && <p className="mt-3 cyan-d">{status}</p>}
        </form>
      </div>
    </div>
  )
}
