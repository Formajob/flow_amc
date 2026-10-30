"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = require('@supabase/supabase-js').createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      async function fetchStats() {
        const { data, error } = await supabase
          .from('amc_entries')
          .select('*')

        if (error) throw error

        let totalPieces = 0
        let totalMoney = 0

        data.forEach(entry => {
          const qty = Math.abs(entry.qty)
          if (entry.is_money) totalMoney += qty
          else totalPieces += qty
        })

        setStats({ totalPieces, totalMoney })
      }

      fetchStats()
    }

    setLoading(false)
  }, [])

  if (loading) return <div className="p-8">Chargement...</div>

  const navy = '#0b1330'
  const encre = '#18213b'
  const cyan = '#26d4ea'
  const cyanD = '#0aa8bd'
  const fond = '#f6f7fb'
  const filet = '#e4e8f1'
  const objectifs = { pantalons: 120, pulls: 120, pyjamas: 80, peignoirs: 40, djellaba_f: 40, djellaba_h: 40, jackets: 60, manteaux: 48, chales: 80, argent: 20000 }

  const totalPieces = stats ? stats.totalPieces : 0
  const totalMoney = stats ? stats.totalMoney : 0

  return (
    <div style={{ minHeight: '100vh', background: fond, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ background: navy, color: '#fff', padding: '20px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.03em' }}>AMC · Tableau de bord</h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.8 }}>Caravane humaine, 11e édition</p>
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Douar Ilissi · 26-27 déc. 2026</div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 25, boxShadow: '0 2px 8px rgba(0,0,0,0.05' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 20, textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontSize: 32, color: navy, marginBottom: 8 }}>0</div>
              <div style={{ fontSize: 14, color: encre, marginBottom: 4 }}>Pièces collectées</div>
              <div style={{ width: '100%', height: 8, background: filet, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ width: totalPieces / 508 * 100 + '%', height: '100%', background: cyan, transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ fontSize: 12, color: encre, marginTop: 4 }}>0</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 8, padding: 20, textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontSize: 32, color: navy, marginBottom: 8 }}>0</div>
              <div style={{ fontSize: 14, color: encre, marginBottom: 4 }}>MAD collectés</div>
              <div style={{ width: '100%', height: 8, background: filet, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ width: totalMoney / 20000 * 100 + '%', height: '100%', background: cyanD, transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ fontSize: 12, color: encre, marginTop: 4 }}>0</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 8, padding: 20, textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontSize: 32, color: navy, marginBottom: 8 }}>0</div>
              <div style={{ fontSize: 14, color: encre, marginBottom: 4 }}>Groupes actifs</div>
              <div style={{ fontSize: 12, color: encre, marginTop: 4 }}>4 groupes</div>
            </div>
          </div>

          <div style={{ marginTop: 30, padding: 20, background: '#fff', borderRadius: 8 }}>
            <h3 style={{ margin: '0 0 20px 0', color: navy, fontSize: 18 }}>Objectifs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              <div style={{ background: '#f0f0f0', borderRadius: 4, padding: 10, textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontWeight: 'bold', color: navy, fontSize: 14 }}>Pantalons</div>
                <div>{objectifs.pantalons} pièces</div>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: 4, padding: 10, textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontWeight: 'bold', color: navy, fontSize: 14 }}>Pulls laine</div>
                <div>{objectifs.pulls} pièces</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}