import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'

// Importar Map dinamicamente sem SSR
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Carregando mapa...</div>
})

export default function Home() {
    const [shelters, setShelters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [minVagas, setMinVagas] = useState('');
    const [isFeminino, setIsFeminino] = useState(false);
    const [isPetFriendly, setIsPetFriendly] = useState(false);
    const [isMasculino, setIsMasculino] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const [userLocation, setUserLocation] = useState(null);
    const [sortByDistance, setSortByDistance] = useState(false);

    useEffect(() => {
        async function fetchShelters() {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (minVagas) params.append('min_vagas', minVagas);
            if (isFeminino) params.append('tipo_feminino', 'true');
            if (isMasculino) params.append('tipo_masculino', 'true');
            if (isPetFriendly) params.append('aceita_pets', 'true');
            params.append('page', currentPage);
            params.append('limit', pageSize);

            if (sortByDistance && userLocation) {
                params.append('lat', userLocation.lat);
                params.append('lng', userLocation.lng);
            }

            const queryString = params.toString();
            const url = `http://localhost:5000/api/abrigos?${queryString}`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    setShelters(data.abrigos || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                } else {
                    throw new Error(data.message || 'Erro ao buscar abrigos');
                }
            } catch (err) {
                console.error('Erro detalhado:', err);
                if (err.message === 'Failed to fetch') {
                    setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
                } else {
                    setError(err.message);
                }
                setShelters([]);
            } finally {
                setLoading(false);
            }
        }

        if (!sortByDistance || userLocation) {
            fetchShelters();
        }
    }, [searchTerm, minVagas, isFeminino, isMasculino, isPetFriendly, currentPage, pageSize, sortByDistance, userLocation]);

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleSortByDistance = () => {
        if (!sortByDistance) {
            setLoading(true);
            if (navigator.geolocation) {
                const options = {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000,
                };

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        });
                        setSortByDistance(true);
                        setCurrentPage(1);
                    },
                    (error) => {
                        alert("Não foi possível obter sua localização.");
                        setLoading(false);
                    }, options
                );
            } else {
                alert("Geolocalização não é suportada por este navegador.");
                setLoading(false);
            }
        } else {
            setSortByDistance(false);
            setUserLocation(null);
        }
    };

    const formatDistance = (meters) => {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Baita Ajuda</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Baita Ajuda</h1>
                    <nav className={styles.nav}>
                        <Link href="/login" className={styles.navLink}>Entrar</Link>
                        <Link href="/register" className={styles.navLink}>Registrar</Link>
                        <Link href="/add-shelter" className={styles.navLink}>Adicionar Abrigo</Link>
                        <Link href="/manage-shelters" className={styles.navLink}>Gerenciar Abrigos</Link>
                    </nav>
                </div>
            </header>

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
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isFeminino}
                            onChange={(e) => setIsFeminino(e.target.checked)}
                        />
                        Feminino
                    </label>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isMasculino}
                            onChange={(e) => setIsMasculino(e.target.checked)}
                        />
                        Masculino
                    </label>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isPetFriendly}
                            onChange={(e) => setIsPetFriendly(e.target.checked)}
                        />
                        Aceita Pets
                    </label>
                    <button onClick={handleSortByDistance} className={styles.distanceButton}>
                        {sortByDistance ? 'Limpar Ordenação' : 'Ordenar por Proximidade'}
                    </button>
                </div>

                {/* Lista de Abrigos */}
                <div className={styles.shelterSection}>
                    <h2>Abrigos Disponíveis</h2>
                    
                    {loading && <p>Carregando abrigos...</p>}
                    {error && <p className={styles.errorMsg}>Erro ao carregar: {error}</p>}

                    {!loading && !error && (
                        <div className={styles.shelterList}>
                            {shelters.length > 0 ? (
                                shelters.map(shelter => (
                                    <Link key={shelter.id} href={`/shelters/${shelter.id}`} className={styles.shelterLink}>
                                        <div className={styles.shelterCard}>
                                            <h3>{shelter.nome}</h3>
                                            {shelter.distance_meters != null && (
                                                <p className={styles.distanceText}>
                                                    <strong>Distância:</strong> {formatDistance(shelter.distance_meters)}
                                                </p>
                                            )}
                                            <p>{shelter.endereco}</p>
                                            <p><strong>Vagas Disponíveis:</strong> {shelter.vagas_disponiveis}</p>
                                            {shelter.media_avaliacoes && (
                                                <p><strong>Avaliação:</strong> {Number(shelter.media_avaliacoes).toFixed(1)} ⭐</p>
                                            )}
                                            <div className={styles.tags}>
                                                {shelter.aceita_pets && <span className={styles.tag}>Aceita Pets</span>}
                                                {shelter.tipo_feminino && <span className={styles.tag}>Feminino</span>}
                                                {shelter.tipo_masculino && <span className={styles.tag}>Masculino</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p>Nenhum abrigo encontrado.</p>
                            )}
                        </div>
                    )}

                    {/* Paginação */}
                    {!loading && totalPages > 0 && (
                        <div className={styles.paginationContainer}>
                            <select value={pageSize} onChange={handlePageSizeChange}>
                                <option value="5">5 por página</option>
                                <option value="10">10 por página</option>
                                <option value="20">20 por página</option>
                            </select>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </button>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>

                {/* Mapa */}
                <div className={styles.mapSection}>
                    <h2>Mapa de Abrigos</h2>
                    <div className={styles.mapContainer}>
                        {loading ? (
                            <div className={styles.loading}>Carregando mapa...</div>
                        ) : error ? (
                            <div className={styles.error}>
                                <p>Erro ao carregar mapa: {error}</p>
                            </div>
                        ) : (
                            <Map shelters={shelters} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}