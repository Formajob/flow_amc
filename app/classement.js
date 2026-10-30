import Link from 'next/link'
import { useEffect, useState } from 'react'
import supabase from '@supabase/supabase-js'

export default function Classement() {
  const [ranked, setRanked] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supa = supabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const fetchRanking = async () => {
      const { data, error } = await supa
        .from('amc_entries')
        .select(`
          *,
          amc_groups!inner (label, code),
          amc_members!inner (name)
        `)

      if (error) throw error

      // Calculer les stats par groupe
      const byGroup = {}

      data.forEach(entry => {
        const groupId = entry.amc_groups.id
        if (!byGroup[groupId]) byGroup[groupId] = { pieces: 0, money: 0, members: {} }

        const qty = Math.abs(entry.qty)
        const isMoney = entry.amc_item_types.is_money

        if (isMoney) {
          byGroup[groupId].money += qty
        } else {
          byGroup[groupId].pieces += qty
        }

        // Membres
        const memberName = entry.amc_members.name
        if (memberName) {
          if (!byGroup[groupId].members[memberName]) {
            byGroup[groupId].members[memberName] = { pieces: 0, money: 0 }
          }
          if (isMoney) {
            byGroup[groupId].members[memberName].money += qty
          } else {
            byGroup[groupId].members[memberName].pieces += qty
          }
        }
      })

      // Calculer les scores et classements
      const results = Object.entries(byGroup).map(([groupId, stats]) => {
        const score = stats.pieces + stats.money / 50 // 1 point par pièce, 1 point pour 50 MAD
        const members = Object.entries(stats.members).map(([name, data]) => ({
          name,
          pieces: data.pieces,
          money: data.money,
          score: data.pieces + data.money / 50,
        })).sort((a, b) => b.score - a.score)

        return {
          groupId,
          label: stats.label || `Groupe ${groupId}`,
          pieces: stats.pieces,
          money: stats.money,
          score,
          members,
        }
      })

      // Trier par score global
      results.sort((a, b) => b.score - a.score)
      results.forEach((r, i) => setRanked((prev) => [...prev, { ...r, rank: i + 1 }]))

      setLoading(false)
    }

    fetchRanking()
  }, [])

  if (loading) return <div className="p-8">Chargement...</div>

  return (
    <div className="app min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Classement · AMC</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ranked.map((group) => (
            <div key={group.groupId} className="card h-full">
              <div className="p-4 border-b filet">
                <div className="flex justify-between items-center">
                  <span className="navy font-bold">{group.label}</span>
                  <span className="encore text-sm">{group.rank}ème</span>
                </div>
                <p className="muted text-sm">Objectif: {Math.round(group.pieces / 4)} pièces (quart)</p>
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
                      <div className="flex-1"><div className="bar"><i style="--w:" + Math.round(member.score / group.score * 100) + "%;background:" + group.color + ';"></i></div><div className="pts">{AMC.fmt(member.score)} pts</div></div>
                    </li>
                  ))}
                </ol>

                <p className="mt-2 encre">Objectif du groupe: {Math.round(AMC.pct(group.pieces, Math.round(group.pieceTarget / 4)))} % des pièces</p>
                <p className="mt-1 muted">Douar Ilissi · 26-27 déc. 2026</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button className="btn-navy py-2 px-6">Copier le texte des quatre groupes</button>
          <span id="copied" className="muted ml-2"></span>
        </div>
      </div>
    </div>
  )
}

// Helper functions to embed
const ranks = ['#c9a227', '#d08a3a', '#c4a15a', '#b9a06a', '#1f8a56', '#18213b']

// Simuler les fonctions AMC depuis les HTML originaux
const AMC = {
  pct: (got, total) => total > 0 ? Math.round((got / total) * 100) : 0,
  fmt: (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  memberName: (id) => id || 'Inconnu',
}