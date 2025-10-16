import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/ManageShelters.module.css';

export default function ManageShelters() {
  const [abrigos, setAbrigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se usuário está logado
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchUserShelters();
  }, []);

  const fetchUserShelters = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`http://localhost:5000/api/abrigos/user/${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAbrigos(data.abrigos);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar abrigos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShelter = async (abrigoId) => {
    if (!confirm('Tem certeza que deseja excluir este abrigo?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${abrigoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAbrigos(abrigos.filter(abrigo => abrigo.id !== abrigoId));
          alert('Abrigo excluído com sucesso!');
        }
      } else {
        alert('Erro ao excluir abrigo');
      }
    } catch (error) {
      console.error('Erro ao excluir abrigo:', error);
      alert('Erro ao excluir abrigo');
    }
  };

  const handleEditShelter = (abrigoId) => {
    router.push(`/edit-shelter?id=${abrigoId}`);
  };

  const handleAddShelter = () => {
    router.push('/add-shelter');
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Meus Abrigos</h1>
          <button className={styles.addButton} onClick={handleAddShelter}>
            Adicionar Novo Abrigo
          </button>
        </div>

        {abrigos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Você ainda não possui abrigos cadastrados.</p>
            <button className={styles.primaryButton} onClick={handleAddShelter}>
              Cadastrar Primeiro Abrigo
            </button>
          </div>
        ) : (
          <div className={styles.sheltersGrid}>
            {abrigos.map((abrigo) => (
              <div key={abrigo.id} className={styles.shelterCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.shelterName}>{abrigo.nome}</h3>
                  <span className={abrigo.vagas_disponiveis > 0 ? styles.available : styles.full}>
                    {abrigo.vagas_disponiveis > 0 ? 'Disponível' : 'Lotado'}
                  </span>
                </div>
                
                <div className={styles.cardContent}>
                  <p><strong>Endereço:</strong> {abrigo.endereco}</p>
                  {abrigo.tipo_abrigo && (
                    <p><strong>Tipo:</strong> {abrigo.tipo_abrigo}</p>
                  )}
                  <p><strong>Vagas:</strong> {abrigo.vagas_disponiveis}</p>
                  {abrigo.formulario_inscricao_url && (
                    <p><strong>Formulário:</strong> 
                      <a href={abrigo.formulario_inscricao_url} target="_blank" rel="noopener noreferrer">
                        Acessar
                      </a>
                    </p>
                  )}
                  {abrigo.media_avaliacoes > 0 && (
                    <p><strong>Avaliação:</strong> {abrigo.media_avaliacoes.toFixed(1)}/5</p>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button 
                    className={styles.detailsButton}
                    onClick={() => router.push(`/shelter-details?id=${abrigo.id}`)}
                  >
                    Gerenciar
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDeleteShelter(abrigo.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.navigation}>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            Voltar ao Início
          </button>
        </div>
      </main>
    </div>
  );
}