import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/ShelterDetails.module.css';
import Header from '../../components/Header';

export default function EditShelter() {
  const [abrigo, setAbrigo] = useState(null);
  const [necessidades, setNecessidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddNeed, setShowAddNeed] = useState(false);
  const [newNeed, setNewNeed] = useState({ item: '', quantidade: '' });
  const [editingNeed, setEditingNeed] = useState(null);
  const [saving, setSaving] = useState(false);
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
        if (data.success) setAbrigo(data.abrigo);
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
        if (data.success) setNecessidades(data.necessidades);
      }
    } catch (error) {
      console.error('Erro ao buscar necessidades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Form state derived from abrigo
  const [formState, setFormState] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    vagas_disponiveis: '',
    formulario_inscricao_url: '',
    tipo_abrigo: []
  });

  useEffect(() => {
    if (!abrigo) return;
    setFormState({
      nome: abrigo.nome || '',
      endereco: abrigo.endereco || '',
      cidade: abrigo.cidade || '',
      estado: abrigo.estado || '',
      vagas_disponiveis: abrigo.vagas_disponiveis != null ? String(abrigo.vagas_disponiveis) : '',
      formulario_inscricao_url: abrigo.formulario_inscricao_url || '',
      tipo_abrigo: [
        abrigo.tipo_feminino ? 'Feminino' : null,
        abrigo.tipo_masculino ? 'Masculino' : null,
        abrigo.aceita_pets ? 'Pets' : null
      ].filter(Boolean)
    });
  }, [abrigo]);

  const handleTipoToggle = (tipo) => {
    setFormState(prev => {
      const arr = prev.tipo_abrigo || [];
      return {
        ...prev,
        tipo_abrigo: arr.includes(tipo) ? arr.filter(t => t !== tipo) : [...arr, tipo]
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return router.push('/login');

      // preserve address fields from the loaded abrigo; do not allow editing them here
      const payload = {
        usuario_id: user.id,
        nome: formState.nome,
        endereco: abrigo.endereco || null,
        cidade: abrigo.cidade || null,
        estado: abrigo.estado || null,
        vagas_disponiveis: parseInt(formState.vagas_disponiveis) || 0,
        formulario_inscricao_url: formState.formulario_inscricao_url || null,
        tipo_abrigo: formState.tipo_abrigo
      };

      const resp = await fetch(`http://localhost:5000/api/abrigos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await resp.json();
      if (j.success) {
        // refresh and redirect to shelter details
        router.push(`/shelters/${id}`);
      } else {
        alert(j.error || 'Erro ao salvar abrigo');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNeed = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNeed)
      });
      const data = await response.json();
      if (data.success) {
        setNecessidades([data.necessidade, ...necessidades]);
        setNewNeed({ item: '', quantidade: '' });
        setShowAddNeed(false);
      } else {
        alert(data.error || 'Erro ao adicionar necessidade');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar necessidade');
    }
  };

  const handleUpdateNeed = async (needId, updatedNeed) => {
    try {
      const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNeed)
      });
      const data = await response.json();
      if (data.success) {
        setNecessidades(necessidades.map(n => n.id === needId ? data.necessidade : n));
        setEditingNeed(null);
      } else {
        alert(data.error || 'Erro ao atualizar necessidade');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar necessidade');
    }
  };

  const handleDeleteNeed = async (needId) => {
    if (!confirm('Tem certeza que deseja remover esta necessidade?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) setNecessidades(necessidades.filter(n => n.id !== needId));
      else alert(data.error || 'Erro ao remover necessidade');
    } catch (err) {
      console.error(err);
      alert('Erro ao remover necessidade');
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (!abrigo) return <div className={styles.error}>Abrigo não encontrado</div>;

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.titleSection}>
            <h2>Gerenciar Abrigo</h2>
            <h3>{abrigo.nome}</h3>
          </div>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => router.push('/manage-shelters')}>Voltar</button>
        </div>

        <div className={styles.content}>
          <div className={styles.infoCard}>
            <h4>Informações do Abrigo</h4>
            <form className={styles.infoGrid} onSubmit={handleSave}>
              <div className={styles.infoItem}>
                <strong>Endereço:</strong>
                <span>{abrigo.endereco}</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Aceita:</strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={formState.tipo_abrigo.includes('Pets')} onChange={() => handleTipoToggle('Pets')} /> Pets
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={formState.tipo_abrigo.includes('Feminino')} onChange={() => handleTipoToggle('Feminino')} /> Feminino
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={formState.tipo_abrigo.includes('Masculino')} onChange={() => handleTipoToggle('Masculino')} /> Masculino
                  </label>
                </div>
              </div>
              <div className={styles.infoItem}>
                <strong>Vagas:</strong>
                <span>
                  <input type="number" min="0" value={formState.vagas_disponiveis} onChange={e => setFormState({ ...formState, vagas_disponiveis: e.target.value })} style={{ width: 120 }} />
                </span>
              </div>
              <div className={styles.infoItem}>
                <strong>Status:</strong>
                <span className={abrigo.vagas_disponiveis > 0 ? styles.available : styles.full}>
                  {abrigo.vagas_disponiveis > 0 ? 'Disponível' : 'Lotado'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <strong>Formulário:</strong>
                <input value={formState.formulario_inscricao_url} onChange={e => setFormState({ ...formState, formulario_inscricao_url: e.target.value })} />
              </div>

              <div className={styles.infoItem} style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>

          <div className={styles.needsCard}>
            <div className={styles.cardHeader}>
              <h4>Necessidades do Abrigo</h4>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowAddNeed(true)}>Adicionar Necessidade</button>
            </div>

            {showAddNeed && (
              <div className={styles.addForm}>
                <form onSubmit={handleAddNeed}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Item necessário</label>
                      <input type="text" placeholder="Ex: Cobertores" value={newNeed.item} onChange={e => setNewNeed({ ...newNeed, item: e.target.value })} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Quantidade</label>
                      <input type="text" placeholder="Ex: 10 unidades" value={newNeed.quantidade} onChange={e => setNewNeed({ ...newNeed, quantidade: e.target.value })} required />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Salvar</button>
                    <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => { setShowAddNeed(false); setNewNeed({ item: '', quantidade: '' }); }}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            <div className={styles.needsList}>
              {necessidades.length === 0 ? (
                <p className={styles.emptyState}>Nenhuma necessidade cadastrada ainda.</p>
              ) : (
                necessidades.map(necessidade => (
                  <div key={necessidade.id} className={styles.needItem}>
                    {editingNeed === necessidade.id ? (
                      <EditNeedForm necessidade={necessidade} onSave={updated => handleUpdateNeed(necessidade.id, updated)} onCancel={() => setEditingNeed(null)} />
                    ) : (
                      <div className={styles.needContent}>
                        <div className={styles.needInfo}>
                          <span className={styles.itemName}>{necessidade.item}</span>
                          <span className={styles.itemQuantity}>{necessidade.quantidade}</span>
                        </div>
                        <div className={styles.needActions}>
                          <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => setEditingNeed(necessidade.id)}>Editar</button>
                          <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDeleteNeed(necessidade.id)}>Remover</button>
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
  const [editData, setEditData] = useState({ item: necessidade.item, quantidade: necessidade.quantidade });
  const handleSubmit = (e) => { e.preventDefault(); onSave(editData); };
  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <input type="text" value={editData.item} onChange={e => setEditData({ ...editData, item: e.target.value })} required />
        </div>
        <div className={styles.formGroup}>
          <input type="text" value={editData.quantidade} onChange={e => setEditData({ ...editData, quantidade: e.target.value })} required />
        </div>
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Salvar</button>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
