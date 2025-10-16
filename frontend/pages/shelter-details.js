import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/ShelterDetails.module.css';

export default function ShelterDetails() {
  const [abrigo, setAbrigo] = useState(null);
  const [necessidades, setNecessidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddNeed, setShowAddNeed] = useState(false);
  const [newNeed, setNewNeed] = useState({ item: '', quantidade: '' });
  const [editingNeed, setEditingNeed] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));

    if (id) {
      fetchShelterDetails();
      fetchNecessidades();
    }
  }, [id]);

  const fetchShelterDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAbrigo(data.abrigo);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do abrigo:', error);
    }
  };

  const fetchNecessidades = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNecessidades(data.necessidades);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar necessidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNeed = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNeed),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNecessidades([data.necessidade, ...necessidades]);
          setNewNeed({ item: '', quantidade: '' });
          setShowAddNeed(false);
        }
      } else {
        alert('Erro ao adicionar necessidade');
      }
    } catch (error) {
      console.error('Erro ao adicionar necessidade:', error);
      alert('Erro ao adicionar necessidade');
    }
  };

  const handleUpdateNeed = async (needId, updatedNeed) => {
    try {
      const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNeed),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNecessidades(necessidades.map(n => 
            n.id === needId ? data.necessidade : n
          ));
          setEditingNeed(null);
        }
      } else {
        alert('Erro ao atualizar necessidade');
      }
    } catch (error) {
      console.error('Erro ao atualizar necessidade:', error);
      alert('Erro ao atualizar necessidade');
    }
  };

  const handleDeleteNeed = async (needId) => {
    if (!confirm('Tem certeza que deseja remover esta necessidade?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNecessidades(necessidades.filter(n => n.id !== needId));
      } else {
        alert('Erro ao remover necessidade');
      }
    } catch (error) {
      console.error('Erro ao remover necessidade:', error);
      alert('Erro ao remover necessidade');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!abrigo) {
    return <div className={styles.error}>Abrigo não encontrado</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>
            <Link href="/">Baita Ajuda</Link>
          </h1>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.titleSection}>
            <h2>Gerenciar Abrigo</h2>
            <h3>{abrigo.nome}</h3>
          </div>
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => router.push('/manage-shelters')}
          >
            Voltar
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.infoCard}>
            <h4>Informações do Abrigo</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>Endereço:</strong>
                <span>{abrigo.endereco}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Tipo:</strong>
                <span>{abrigo.tipo_abrigo || 'Não especificado'}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Vagas:</strong>
                <span>{abrigo.vagas_disponiveis}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Status:</strong>
                <span className={abrigo.vagas_disponiveis > 0 ? styles.available : styles.full}>
                  {abrigo.vagas_disponiveis > 0 ? 'Disponível' : 'Lotado'}
                </span>
              </div>
              {abrigo.formulario_inscricao_url && (
                <div className={styles.infoItem}>
                  <strong>Formulário:</strong>
                  <a href={abrigo.formulario_inscricao_url} target="_blank" rel="noopener noreferrer">
                    Acessar formulário
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className={styles.needsCard}>
            <div className={styles.cardHeader}>
              <h4>Necessidades do Abrigo</h4>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setShowAddNeed(true)}
              >
                Adicionar Necessidade
              </button>
            </div>

            {showAddNeed && (
              <div className={styles.addForm}>
                <form onSubmit={handleAddNeed}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Item necessário</label>
                      <input
                        type="text"
                        placeholder="Ex: Cobertores, Alimentos, etc."
                        value={newNeed.item}
                        onChange={(e) => setNewNeed({ ...newNeed, item: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Quantidade</label>
                      <input
                        type="text"
                        placeholder="Ex: 10 unidades, Urgente"
                        value={newNeed.quantidade}
                        onChange={(e) => setNewNeed({ ...newNeed, quantidade: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                      Salvar
                    </button>
                    <button 
                      type="button" 
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => {
                        setShowAddNeed(false);
                        setNewNeed({ item: '', quantidade: '' });
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className={styles.needsList}>
              {necessidades.length === 0 ? (
                <p className={styles.emptyState}>Nenhuma necessidade cadastrada ainda.</p>
              ) : (
                necessidades.map((necessidade) => (
                  <div key={necessidade.id} className={styles.needItem}>
                    {editingNeed === necessidade.id ? (
                      <EditNeedForm
                        necessidade={necessidade}
                        onSave={(updatedNeed) => handleUpdateNeed(necessidade.id, updatedNeed)}
                        onCancel={() => setEditingNeed(null)}
                      />
                    ) : (
                      <div className={styles.needContent}>
                        <div className={styles.needInfo}>
                          <span className={styles.itemName}>{necessidade.item}</span>
                          <span className={styles.itemQuantity}>{necessidade.quantidade}</span>
                        </div>
                        <div className={styles.needActions}>
                          <button 
                            className={`${styles.btn} ${styles.btnEdit}`}
                            onClick={() => setEditingNeed(necessidade.id)}
                          >
                            Editar
                          </button>
                          <button 
                            className={`${styles.btn} ${styles.btnDelete}`}
                            onClick={() => handleDeleteNeed(necessidade.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function EditNeedForm({ necessidade, onSave, onCancel }) {
  const [editData, setEditData] = useState({
    item: necessidade.item,
    quantidade: necessidade.quantidade
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <input
            type="text"
            value={editData.item}
            onChange={(e) => setEditData({ ...editData, item: e.target.value })}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <input
            type="text"
            value={editData.quantidade}
            onChange={(e) => setEditData({ ...editData, quantidade: e.target.value })}
            required
          />
        </div>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={`styles.btn} ${styles.btnPrimary}`}>
          Salvar
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}