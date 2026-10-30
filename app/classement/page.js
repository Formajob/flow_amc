"use client"
import { useEffect, useState } from 'react'
const { createClient } = require('@supabase/supabase-js')

const ranks = ['#c9a227', '#d08a3a', '#c4a15a', '#b9a06a', '#1f8a56', '#18213b']

const AMC = {
  pct: (got, total) => total > 0 ? Math.round((got / total) * 100) : 0,
  fmt: (n) => n ? Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0',
  memberName: (id) => id || 'Inconnu',
}

export default function Classement() {
  const [ranked, setRanked] = useState([])
  const [loading, setLoading] = useState(true)
  const [supa, setSupa] = useState(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupa(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
    }
  }, [])

  useEffect(() => {
    if (!supa) { setLoading(false); return }
    async function fetchRanking() {
      const { data, error } = await supa.from('amc_entries').select(`*, amc_groups!inner (label, code), amc_members!inner (name)`)
      if (error) console.error(error)
      else {
        const byGroup = {}
        ;(data || []).forEach(entry => {
          const groupId = entry.amc_groups?.id
          if (!groupId) return
          if (!byGroup[groupId]) byGroup[groupId] = { pieces: 0, money: 0, members: {}, label: entry.amc_groups.label }
          const qty = Math.abs(entry.qty)
          const isMoney = entry.is_money
          if (isMoney) byGroup[groupId].money += qty
          else byGroup[groupId].pieces += qty
          const memberName = entry.amc_members?.name
          if (memberName) {
            if (!byGroup[groupId].members[memberName]) byGroup[groupId].members[memberName] = { pieces: 0, money: 0 }
            if (isMoney) byGroup[groupId].members[memberName].money += qty
            else byGroup[groupId].members[memberName].pieces += qty
          }
        })
        const results = Object.entries(byGroup).map(([groupId, stats]) => ({
          groupId, label: stats.label || `Groupe ${groupId}`, pieces: stats.pieces, money: stats.money,
          score: stats.pieces + stats.money / 50,
          members: Object.entries(stats.members).map(([name, d]) => ({ name, pieces: d.pieces, money: d.money, score: d.pieces + d.money / 50 })).sort((a, b) => b.score - a.score)
        })).sort((a, b) => b.score - a.score)
        results.forEach((r, i) => setRanked(prev => [...prev, { ...r, rank: i + 1 }]))
      }
      setLoading(false)
    }
    fetchRanking()
  }, [supa])

  if (loading) return <div className="p-8">Chargement...</div>

  return (
    <div className="app min-h-screen" style={{ background: '#f6f7fb' }}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Classement · AMC</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ranked.map((group) => (
            <div key={group.groupId} className="card h-full">
              <div className="p-4 border-b filet">
                <div className="flex justify-between items-center">
                  <span className="navy font-bold">{group.label}</span>
                  <span className="text-sm text-muted">{group.rank}ème</span>
                </div>
                <p className="text-xs muted">Objectif: {Math.round(group.pieces / 4)} pièces (quart)</p>
              </div>
              <div className="pb-4">
                <ol className="space-y-2">
                  {group.members.slice(0, 5).map((member, i) => (
                    <li key={member.name} className="flex items-center gap-3">
                      <span className="rank" style={{ background: ranks[i] }}>{i + 1}</span>
                      <div>
                        <span className="font-medium">{AMC.memberName(member.name)}</span>
                        <span className="text-xs muted">{member.pieces} pcs · {AMC.fmt(member.money)} MAD</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
