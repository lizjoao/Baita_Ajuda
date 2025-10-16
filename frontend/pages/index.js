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

	    const queryString = params.toString();
	    const url = `http://localhost:5000/api/abrigos?${queryString}`;

	    try {
		const response = await fetch(url);
		if (!response.ok) throw new Error('Failed to fetch data');
		const data = await response.json();
		setShelters(data.abrigos);
	    } catch (err) {
		setError(err.message);
	    } finally {
		setLoading(false);
	    }
	}

	fetchShelters();
    }, [searchTerm, minVagas, isFeminino, isMasculino, isPetFriendly]);

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
          <Link href="/manage-shelters" className={styles.btn}>
            Gerenciar Abrigos
          </Link>

          <div className={styles.filterContainer}>
          <input
            type="text"
            placeholder="Buscar por nome ou endereço..."
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
            Apenas Feminino
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
                  <div key={shelter.id} className={styles.shelterCard}>
                    <h3>{shelter.nome}</h3>
                    <p>{shelter.endereco}</p>
                    <p><strong>Vagas Disponíveis:</strong> {shelter.vagas_disponiveis}</p>
                    <div className={styles.tags}>
                      {shelter.aceita_pets && <span className={styles.tag}>Aceita Pets</span>}
                      {shelter.tipo_feminino && <span className={styles.tag}>Feminino</span>}
                      {shelter.tipo_masculino && <span className={styles.tag}>Masculino</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhum abrigo encontrado.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
