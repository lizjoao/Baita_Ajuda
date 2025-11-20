import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Header from '../components/Header'
import styles from '../styles/Home.module.css'

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <p className={styles.loading}>Carregando mapa...</p>
})

const FILTER_LABELS = {
    feminino: 'Feminino',
    masculino: 'Masculino',
    pets: 'Aceita Pets'
}

export default function Home() {
    const [shelters, setShelters] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [minVagas, setMinVagas] = useState('')
    const [filters, setFilters] = useState({ feminino: false, masculino: false, pets: false })
    const [userLocation, setUserLocation] = useState(null)
    const [sortByDistance, setSortByDistance] = useState(false)

    useEffect(() => {
        if (sortByDistance && !userLocation) return
        
        const params = new URLSearchParams()
        
        if (searchTerm) params.append('search', searchTerm)
        if (minVagas) params.append('min_vagas', minVagas)
        if (filters.feminino) params.append('tipo_feminino', 'true')
        if (filters.masculino) params.append('tipo_masculino', 'true')
        if (filters.pets) params.append('aceita_pets', 'true')
        if (sortByDistance && userLocation) {
            params.append('lat', userLocation.lat)
            params.append('lng', userLocation.lng)
        }

        setLoading(true)
        setError(null)

        fetch(`http://localhost:5000/api/abrigos?${params}`)
            .then(res => res.ok ? res.json() : Promise.reject(`Erro HTTP: ${res.status}`))
            .then(data => {
                if (data.success) {
                    setShelters(data.abrigos || [])
                } else {
                    throw new Error(data.error || 'Erro ao buscar abrigos')
                }
            })
            .catch(err => {
                console.error('Erro:', err)
                setError('Erro ao carregar abrigos')
                setShelters([])
            })
            .finally(() => setLoading(false))
    }, [searchTerm, minVagas, filters, sortByDistance, userLocation])

    const handleFilterChange = (filterName) => {
        setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }))
    }

    const handleSortByDistance = () => {
        if (!sortByDistance && navigator.geolocation) {
            setLoading(true)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                    setSortByDistance(true)
                },
                () => {
                    alert("Não foi possível obter sua localização.")
                    setLoading(false)
                },
                { timeout: 10000 }
            )
        } else {
            setSortByDistance(false)
            setUserLocation(null)
        }
    }

    return (
        <div className={styles.container}>
            <Head><title>Baita Ajuda</title></Head>
            <Header />

            <main className={styles.main}>
                {/* Filtros */}
                <div className={styles.filterContainer}>
                    <input
                        type="text"
                        placeholder="Nome ou endereço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    <input
                        type="number"
                        placeholder="Vagas mínimas"
                        value={minVagas}
                        onChange={(e) => setMinVagas(e.target.value)}
                        className={styles.vagasInput}
                    />
                    {Object.keys(FILTER_LABELS).map(filter => (
                        <label key={filter} className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={filters[filter]}
                                onChange={() => handleFilterChange(filter)}
                            />
                            <span>{FILTER_LABELS[filter]}</span>
                        </label>
                    ))}
                    <button onClick={handleSortByDistance} className={styles.distanceButton}>
                        {sortByDistance ? 'Limpar Ordenação' : 'Ordenar por Proximidade'}
                    </button>
                </div>

                {/* Mapa */}
                <section className={styles.mapSection}>
                    <h2>Mapa de Abrigos</h2>
                    {error && <p className={styles.errorMsg}>{error}</p>}
                    <div className={styles.mapContainer}>
                        {loading ? (
                            <p className={styles.loading}>Carregando mapa...</p>
                        ) : (
                            <Map shelters={shelters} />
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
