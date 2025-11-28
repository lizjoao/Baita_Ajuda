import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Header from '../components/Header'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

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
    const [sortBy, setSortBy] = useState('date')
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (sortBy === 'distance' && !userLocation) return

        const params = new URLSearchParams()

        if (searchTerm) params.append('search', searchTerm)
        if (minVagas) params.append('min_vagas', minVagas)
        if (filters.feminino) params.append('tipo_feminino', 'true')
        if (filters.masculino) params.append('tipo_masculino', 'true')
        if (filters.pets) params.append('aceita_pets', 'true')

        if (sortBy === 'rating' || sortBy === 'name' || sortBy === 'date') {
             params.append('sort_by', sortBy);
        }
        if (sortBy === 'distance' && userLocation) {
            params.append('lat', userLocation.lat)
            params.append('lng', userLocation.lng)
            params.append('sort_by', 'distance');
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
    }, [searchTerm, minVagas, filters, sortBy, userLocation])

    const handleFilterChange = (filterName) => {
        setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }))
    }

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        if (newSort === 'distance' && navigator.geolocation) {
            setLoading(true)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                    setSortBy('distance')
                },
                () => {
                    alert("Não foi possível obter sua localização. Ordenando por data.")
                    setSortBy('date')
                    setLoading(false)
                },
                { timeout: 10000 }
            )
        } else {
            setUserLocation(null)
            setSortBy(newSort)
        }
    }

    return (
        <div className={styles.container}>
            <Head><title>Baita Ajuda</title></Head>
            <Header />

            <main className={styles.main}>

                {/* 💡 LEFT COLUMN: Scrollable List Catalog */}
                <div className={styles.listCatalog}>

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

                        {/* 💡 NOVO DROPDOWN DE ORDENAÇÃO */}
                        <select
                            value={sortBy}
                            onChange={handleSortChange}
                            className={styles.sortSelect}
                        >
                            <option value="date">Data (Mais Recente)</option>
                            <option value="name">Nome (A-Z)</option>
                            <option value="rating">Melhor Avaliação</option>
                            <option
                                value="distance"
                                disabled={isClient ? !navigator.geolocation : true}
                            >
                                Mais Próximo (Requer GPS)
                            </option>
                        </select>

                        {/* 💡 GRUPO DE CHECKBOXES (Wrapper adicionado) */}
                        <div className={styles.checkboxGroup}>
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
                        </div>
                    </div>

                    {/* Shelters List Display */}
                    <section className={styles.shelterListDisplay}>
                        <h2>Mapa de Abrigos ({shelters.length})</h2>
                        {error && <p className={styles.errorMsg}>{error}</p>}

                        {loading && <p className={styles.loading}>Buscando abrigos...</p>}

                        {!loading && shelters.length > 0 && (
                            <div className={styles.sheltersGrid}>
                                {shelters.map(shelter => {
                                    const rating = shelter.media_avaliacoes ? Number(shelter.media_avaliacoes).toFixed(1) : '0.0';
                                    const vagasStatusClass = shelter.vagas_disponiveis > 0 ? styles.available : styles.full;
                                    const vagasText = shelter.vagas_disponiveis > 0 ? `${shelter.vagas_disponiveis} vagas livres` : 'Lotado';

                                    return (
                                        <Link href={`/shelters/${shelter.id}`} key={shelter.id} style={{ textDecoration: 'none' }}>
                                            <div className={styles.shelterCard}>
                                                <div className={styles.cardHeader}>
                                                    <h3>{shelter.nome}</h3>
                                                    <span style={{ fontSize: '0.9rem', color: '#888' }}>
                                                        {rating} ⭐
                                                    </span>
                                                </div>
                                                <p className={styles.cardAddress}>{shelter.endereco}</p>

                                                <div className={styles.cardVagas}>
                                                    Vagas:
                                                    <span className={vagasStatusClass}>
                                                        {vagasText}
                                                    </span>
                                                </div>

                                                <div className={styles.cardTags}>
                                                    {shelter.aceita_pets && (
                                                        <span className={styles.tagPets}>🐾 Pets</span>
                                                    )}
                                                    {shelter.tipo_feminino && (
                                                        <span className={styles.tagFeminino}>Feminino</span>
                                                    )}
                                                    {shelter.tipo_masculino && (
                                                        <span className={styles.tagMasculino}>Masculino</span>
                                                    )}
                                                </div>

                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        {!loading && shelters.length === 0 && !error && (
                            <p>Nenhum abrigo encontrado com os filtros aplicados.</p>
                        )}
                    </section>

                </div>

                {/* 💡 RIGHT COLUMN: Full Map Background */}
                <section className={styles.mapWrapper}>
                    <div className={styles.mapContainer}>
                        <Map shelters={shelters} />
                    </div>
                </section>
            </main>
        </div>
    )
}
