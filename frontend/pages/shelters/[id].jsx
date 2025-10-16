// In pages/shelters/[id].js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/ShelterDetailsUser.module.css'; // We will create this CSS file

export default function ShelterDetail() {
  const router = useRouter();
  const { id } = router.query; // Get the 'id' from the URL

  const [shelter, setShelter] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch data when the router has the id parameter ready
    if (!id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch both the shelter details and its needs at the same time
        const [shelterRes, needsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/abrigos/${id}`),
          fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`)
        ]);

        if (!shelterRes.ok) throw new Error('Abrigo não encontrado');

        const shelterData = await shelterRes.json();
        const needsData = await needsRes.json();

        setShelter(shelterData.abrigo);
        setNeeds(needsData.necessidades);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]); // Re-run this effect if the id changes

  if (loading) return <div className={styles.centerStatus}>Carregando...</div>;
  if (error) return <div className={styles.centerStatus}>Erro: {error}</div>;
  if (!shelter) return <div className={styles.centerStatus}>Abrigo não encontrado.</div>;

return (
  <div className={styles.container}>
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>Voltar</Link>
      </header>

      {/* --- Informações do Abrigo Card --- */}
      <div className={`${styles.card} ${styles.infoCard}`}>
        <h1>{shelter.nome}</h1>
        <div className={styles.infoGrid}>
          <div className={styles.infoBlock}>
            <h3>Endereço:</h3>
            <p>{shelter.endereco}</p>
          </div>
          <div className={styles.infoBlock}>
            <h3>Avaliação:</h3>
            <p>{Number(shelter.media_avaliacoes).toFixed(1)} ⭐</p>
          </div>
          <div className={styles.infoBlock}>
            <h3>Aceita:</h3>
            <div className={styles.tags}>
              {shelter.aceita_pets && <span>Pets</span>}
              {shelter.tipo_feminino && <span>Feminino</span>}
              {shelter.tipo_masculino && <span>Masculino</span>}
            </div>
          </div>
          <div className={styles.infoBlock}>
            <h3>Vagas:</h3>
            <p>{shelter.vagas_disponiveis}</p>
          </div>
        </div>
      </div>

      {/* --- Necessidades do Abrigo Card --- */}
      <div className={styles.card}>
        <h2>Necessidades do Abrigo</h2>
        {needs.length > 0 ? (
          <ul className={styles.needsList}>
            {needs.map(need => (
              <li key={need.id} className={styles.needsItem}>
                <p>{need.item}</p>
                {need.quantidade && <span>{need.quantidade}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No momento, não há necessidades específicas cadastradas.</p>
        )}
      </div>
    </main>
  </div>
);

}
