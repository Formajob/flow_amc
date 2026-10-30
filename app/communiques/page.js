"use client"
import { useEffect, useState } from 'react'
const { createClient } = require('@supabase/supabase-js')

const AMC = {
  when: (iso) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  },
}

export default function Communiques() {
  const [notices, setNotices] = useState([])
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [supa, setSupa] = useState(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupa(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    }
  }, [])

  useEffect(() => {
    if (!supa) { setLoading(false); return }

    const checkRole = async () => {
      const { data: { user } } = await supa.auth.getUser()
      if (user) {
        const { data: operator } = await supa.from('amc_operators').select('role').eq('email', user.email).single()
        setAdmin(operator?.role === 'admin')
      }
    }
    checkRole()

    const loadNotices = async () => {
      const { data, error } = await supa.from('amc_notices').select('*').order('created_at', { ascending: false })
      if (error) console.error(error)
      setNotices(data || [])
      setLoading(false)
    }
    loadNotices()
  }, [supa])

  const handleAddNotice = async (e) => {
    e.preventDefault()
    if (!supa || !admin) return
    const title = document.getElementById('title')?.value
    const body = document.getElementById('body')?.value
    if (!title || !body) return
    const { error } = await supa.from('amc_notices').insert({
      campaign_id: 'caravane-11', title, body, created_at: new Date().toISOString()
    })
    if (error) console.error(error)
    else { loadNotices(); e.target.reset() }
  }

  const handleRemoveNotice = async (id) => {
    if (!supa) return
    const { error } = await supa.from('amc_notices').delete().eq('id', id)
    if (error) console.error(error)
    else loadNotices()
  }

  function loadNotices() {
    if (!supa) return
    supa.from('amc_notices').select('*').order('created_at', { ascending: false }).then(({ data }) => setNotices(data || []))
  }

  if (loading) return <div className="p-8">Chargement...</div>

  return (
    <div className="app min-h-screen" style={{ background: '#f6f7fb' }}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Communiqués · AMC</h1>
        {admin && (
          <div className="card p-6 mb-6">
            <h2 className="navy text-semibold mb-4">Ajouter un communiqué</h2>
            <form onSubmit={handleAddNotice}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="muted block mb-1">Titre</label><input type="text" id="title" className="border rounded px-3 py-2 w-full" /></div>
                <div><label className="muted block mb-1">Texte</label><textarea id="body" rows={3} className="border rounded px-3 py-2 w-full"></textarea></div>
              </div>
              <button type="submit" className="btn-navy w-full py-2 mt-4">Publier</button>
            </form>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {notices.map((notice) => (
            <div key={notice.id} className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="navy text-sm">{AMC.when(notice.created_at)}</span>
                {admin && <button className="ghost text-red" type="button" onClick={() => handleRemoveNotice(notice.id)}>Retirer</button>}
              </div>
              <h3 className="navy text-semibold mb-2">{notice.title}</h3>
              <p className="muted text-sm">{notice.body}</p>
            </div>
          ))}
        </div>
        {notices.length === 0 && <p className="mt-6 muted">Aucun communiqué pour l'instant.</p>}
      </div>
    </div>
  )
}
