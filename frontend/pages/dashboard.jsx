import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';

// Importação dinâmica do Mapa para evitar erro de SSR no Next.js
const MapWithNoSSR = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div style={{textAlign: 'center', padding: '50px'}}>Carregando mapa...</div>
});

export default function Dashboard() {
  const [shelters, setShelters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Buscar abrigos da API
    async function fetchData() {
      try {
        const res = await fetch('http://localhost:5000/api/abrigos');
        const data = await res.json();
        if (data.success) {
          setShelters(data.abrigos);
        }
      } catch (error) {
        console.error("Erro ao buscar abrigos", error);
      }
    }
    fetchData();
  }, []);

  // Cores da barra lateral (extraídas da imagem)
  const sidebarColors = [
    '#00FFCC', // Ciano
    '#FF00CC', // Magenta
    '#FF0000', // Vermelho
    '#FF6600', // Laranja
    '#33CCFF', // Azul Claro
    '#00FF00', // Verde Neon
    '#3300FF', // Azul Escuro
    '#FFFF00'  // Amarelo
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - Baita Ajuda</title>
      </Head>

      {/* Header Azul */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.helpIcon}>?</div>
          <h1>BAITA AJUDA</h1>
        </div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>CATALOGO</a>
          <div className={styles.divider}>|</div>
          <a href="#" className={styles.navLink}>MAPA</a>
          <div className={styles.divider}>|</div>
          <a href="#" className={styles.navLink}>SUPORTE</a>
        </nav>
      </header>

      <div className={styles.mainContent}>
        {/* Sidebar Colorida */}
        <aside className={styles.sidebar}>
          {sidebarColors.map((color, index) => (
            <div 
              key={index} 
              className={styles.colorBlock} 
              style={{ backgroundColor: color }}
              title={`Filtro Categoria ${index + 1}`} // Placeholder para funcionalidade futura
            />
          ))}
        </aside>

        {/* Área do Mapa */}
        <section className={styles.mapArea}>
          
          {/* Barra de Busca Flutuante */}
          <div className={styles.searchOverlay}>
            <div className={styles.searchBar}>
              <span className={styles.menuIcon}>≡</span>
              <input 
                type="text" 
                placeholder="Buscar abrigo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </div>

          {/* Componente do Mapa */}
          <div className={styles.mapContainer}>
            <MapWithNoSSR shelters={shelters} />
          </div>
        </section>
      </div>
    </div>
  );
}