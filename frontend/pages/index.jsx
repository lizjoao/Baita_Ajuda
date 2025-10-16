import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

import { useState, useEffect } from 'react'; //g

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

    const [userLocation, setUserLocation] = useState(null); //  { lat, lng }
    const [sortByDistance, setSortByDistance] = useState(false);

    // 3. Fetch data when the component mounts
    useEffect(() => {
	async function fetchShelters() {
	    setLoading(true);
	    setError(null);

	    // Build the query string from our filter states
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
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await response.json();
		setShelters(data.abrigos);

		setTotalPages(data.pagination.totalPages);
	    } catch (err) {
		setError(err.message);
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
		    enableHighAccuracy: false, // We don't need super precision
		    timeout: 10000,           // Stop trying after 10 seconds
		    maximumAge: 60000,          // Use a cached position if it's less than a minute old
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
		</div>
	    </header>

	    <main className={styles.main}>

		<div className={styles.buttons}>

		    <Link href="/login" className={styles.btn}>
			Entrar
		    </Link>
		    <Link href="/register" className={styles.btn}>
			Registrar
		    </Link>
		    <Link href="/add-shelter" className={styles.btn}>
			Adicionar Abrigo
		    </Link>

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
			    placeholder="Vagas"
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
		</div>


		<div className={styles.shelterListContainer}>
		    <h2>Abrigos Disponíveis</h2>
		    {loading && <p>Carregando abrigos...</p>}
		    {error && <p className={styles.errorMsg}>Erro ao carregar: {error}</p>}

		    {!loading && !error && (
			<div className={styles.shelterList}>
			    {shelters.length > 0 ? (
				shelters.map(shelter => (
				    <RenderShelter shelter={shelter}/>
				))
			    ) : (
				<p>Nenhum abrigo encontrado.</p>
			    )}
			</div>
		    )}
		</div>

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

			<span>
			    Página {currentPage} de {totalPages}
			</span>

			<button
			    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
			    disabled={currentPage === totalPages}
			>
			    Próxima
			</button>
		    </div>
		)}

	    </main>
	</div>
    )
}

function RenderShelter (props){

    return (
        <div key={props.shelter.id} className={styles.shelterCard}>
	    <h3>{props.shelter.nome}</h3>
	    {props.shelter.distance_meters != null && (
                <p className={styles.distanceText}>
                    <strong>Distância:</strong> {formatDistance(props.shelter.distance_meters)}
                </p>
            )}
	    <p>{props.shelter.endereco}</p>
	    <p><strong>Vagas Disponíveis:</strong> {props.shelter.vagas_disponiveis}</p>
	    <p><strong>Avaliação:</strong> {Number(props.shelter.media_avaliacoes).toFixed(1)} ⭐</p>
	    <div className={styles.tags}>
		{props.shelter.aceita_pets && <span className={styles.tag}>Aceita Pets</span>}
		{props.shelter.tipo_feminino && <span className={styles.tag}>Feminino</span>}
		{props.shelter.tipo_masculino && <span className={styles.tag}>Masculino</span>}
	    </div>
	</div>
    )

}
