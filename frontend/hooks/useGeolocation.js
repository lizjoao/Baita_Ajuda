import { useState } from 'react'

export const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        alert('Não foi possível obter localização')
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  return { location, loading, getLocation, clearLocation: () => setLocation(null) }
}