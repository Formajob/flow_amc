import Link from 'next/link'
import { useState } from 'react'
import supabase from '@supabase/supabase-js'

export default function Transport() {
  const supa = supabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const [transport, setTransport] = useState({
    lead1: '',
    lead2: '',
    charge: false,
    depart: false,
    azilal: false,
    ilissi: false,
  })

  const vehicules = [
    { id: 'fourgon-1', label: 'Fourgon 1', role: 'Vêtements' },
    { id: 'vehicule-2', label: 'Véhicule 2', role: 'Relais' },
  ]

  const handleTransportChange = async (e) => {
    const name = e.target.name
    const value = e.target.checked

    setTransport({ ...transport, [name]: value })

    const { error } = await supa.from('amc_trips').upsert(
      { id: name, [name]: value, role: transport[name] ? vehicules.find(v => v.id === name)?.role : '' },
      { onConflict: 'id' }
    )

    if (error) console.error(error)
  }

  const leads = ['lead1', 'lead2']

  useEffect(() => {
    // Load transport status from Supabase
    supa.from('amc_trips').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setTransport({
          lead1: data.find(t => t.id === 'fourgon-1')?.lead_name || '',
          lead2: data.find(t => t.id === 'vehicule-2')?.lead_name || '',
          charge: data.find(t => t.id === 'fourgon-1')?.charge || false,
          depart: data.find(t => t.id === 'fourgon-1')?.depart || false,
          azilal: data.find(t => t.id === 'fourgon-1')?.azilal || false,
          ilissi: data.find(t => t.id === 'fourgon-1')?.ilissi || false,
        })
      }
    })
  }, [])

  return (
    <div className="app min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="navy text-2xl mb-6">Transport · AMC</h1>

        <div className="card p-6 mb-6">
          <h2 className="navy text-semibold mb-4">Responsables</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="muted block mb-1">Fourgon 1 (Vêtements)</label>
              <input
                type="text"
                name="lead1"
                value={transport.lead1}
                onChange={(e) => handleTransportChange(e)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Responsable"
              />
            </div>
            <div>
              <label className="muted block mb-1">Véhicule 2 (Relais)</label>
              <input
                type="text"
                name="lead2"
                value={transport.lead2}
                onChange={(e) => handleTransportChange(e)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Responsable"
              />
            </div>
          </div>

          <h3 className="navy text-semibold mt-4">Étape du convoi</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="muted text-sm">Chargement</label>
              <input
                type="checkbox"
                name="charge"
                checked={transport.charge}
                onChange={handleTransportChange}
                className="rounded border"
              />
            </div>
            <div>
              <label className="muted text-sm">Départ</label>
              <input
                type="checkbox"
                name="depart"
                checked={transport.depart}
                onChange={handleTransportChange}
                className="rounded border"
              />
            </div>
            <div>
              <label className="muted text-sm">Passage Azilal</label>
              <input
                type="checkbox"
                name="azilal"
                checked={transport.azilal}
                onChange={handleTransportChange}
                className="rounded border"
              />
            </div>
            <div>
              <label className="muted text-sm">Arrivée Douar Ilissi</label>
              <input
                type="checkbox"
                name="ilissi"
                checked={transport.ilissi}
                onChange={handleTransportChange}
                className="rounded border"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mt-4 encre">
            Crénau à confirmer, pas d'heure inventée. Ce qui part, c'est le prêt.
          </p>
          <p className="mt-2 encre">
            Si le prêt est vide, afficher le déclaré et marquer non contrôlé.
          </p>
        </div>
      </div>
    </div>
  )
}