import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '../../components/Header';
// 💡 Importando o CSS unificado "bonito"
import styles from '../../styles/ShelterDetails.module.css';

// Mapa dinâmico
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => <div className={styles.loadingMap}>Carregando mapa...</div>
});

export default function ManageShelter() {
  const router = useRouter();
  const { id } = router.query;

  // Dados Principais
  const [abrigo, setAbrigo] = useState(null);
  const [necessidades, setNecessidades] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Estados de Edição de Info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  // Estados de Edição de Necessidades
  const [showAddNeed, setShowAddNeed] = useState(false);
  const [newNeed, setNewNeed] = useState({ item: '', nivel: 'em_falta' });
  const [editingNeed, setEditingNeed] = useState(null);

  // 1. Carregar Dados
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));

    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [shelterRes, needsRes, reviewsRes, donationsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/abrigos/${id}`),
        fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`),
        fetch(`http://localhost:5000/api/abrigos/${id}/avaliacoes`),
        fetch(`http://localhost:5000/api/abrigos/${id}/doacoes`)
      ]);

      const shelterData = await shelterRes.json();
      const needsData = await needsRes.json();
      const reviewsData = await reviewsRes.json();
      const donationsData = await donationsRes.json();

      if (shelterData.success) {
        setAbrigo(shelterData.abrigo);
        // Preencher formulário de edição com dados atuais
        setEditForm({
            ...shelterData.abrigo,
            tipo: shelterData.abrigo.tipo || 'temporario'
        });
      }
      if (needsData.success) setNecessidades(needsData.necessidades);
      if (reviewsData.success) setReviews(reviewsData.avaliacoes);
      if (donationsData.success) setDonations(donationsData.doacoes);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handlers: Edição do Abrigo
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (type) => {
    if (type === 'Pets') setEditForm(prev => ({ ...prev, aceita_pets: !prev.aceita_pets }));
    if (type === 'Feminino') setEditForm(prev => ({ ...prev, tipo_feminino: !prev.tipo_feminino }));
    if (type === 'Masculino') setEditForm(prev => ({ ...prev, tipo_masculino: !prev.tipo_masculino }));
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
        // Preparar payload completo para o backend
        const tipoAbrigoArray = [];
        if (editForm.aceita_pets) tipoAbrigoArray.push('Pets');
        if (editForm.tipo_feminino) tipoAbrigoArray.push('Feminino');
        if (editForm.tipo_masculino) tipoAbrigoArray.push('Masculino');

        const payload = {
            ...editForm,
            tipo_abrigo: tipoAbrigoArray,
            capacidade_total: parseInt(editForm.capacidade_total) || 0,
            vagas_disponiveis: parseInt(editForm.vagas_disponiveis) || 0
        };

        const response = await fetch(`http://localhost:5000/api/abrigos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
            setAbrigo(data.abrigo);
            setIsEditingInfo(false);
            alert('Informações atualizadas com sucesso!');
        } else {
            alert(data.error || 'Erro ao atualizar');
        }
    } catch (err) {
        alert('Erro de conexão ao salvar.');
    } finally {
        setSavingInfo(false);
    }
  };

  // 3. Handlers: Necessidades
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
        }
    } catch (err) { alert('Erro ao adicionar'); }
  };

    const handleDeleteNeed = async (needId) => {
      console.log("Deletando ID:", needId);
      // if(!confirm("Tem certeza?")) return; // Removido temporariamente para garantir funcionamento

      try {
          const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, {
              method: 'DELETE'
          });

          const data = await response.json();

          if (data.success) {
              setNecessidades(prev => prev.filter(n => n.id !== needId));
          } else {
              alert(data.error || 'Erro ao remover necessidade');
          }
      } catch (err) {
          console.error(err);
          alert('Erro de conexão ao remover');
      }
  };
  const handleUpdateNeed = async (needId, updatedNeed) => {
    try {
        const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedNeed)
        });
        if (response.ok) {
            setNecessidades(prev => prev.map(n => n.id === needId ? { ...n, ...updatedNeed } : n));
            setEditingNeed(null);
        }
    } catch (err) { alert('Erro ao atualizar'); }
  };

  if (loading) return <div className={styles.centerStatus}>Carregando...</div>;
  if (!abrigo) return <div className={styles.centerStatus}>Abrigo não encontrado.</div>;

  const meanRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>

        {/* Cabeçalho com Botão Voltar e Status */}
        <div className={styles.headerRow}>
            <div>
                <h1>{abrigo.nome}</h1>
                <Link href="/manage-shelters" className={styles.backLink} style={{marginBottom:0, marginTop:'0.5rem'}}>
                    ← Voltar para Meus Abrigos
                </Link>
            </div>
            <div>
                <span className={abrigo.ativo ? styles.badgeActive : styles.badgeInactive}>
                    {abrigo.ativo ? 'Em Funcionamento' : 'Inativo'}
                </span>
            </div>
        </div>

        {/* --- INFO CARD (Alterna entre View e Edit) --- */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2>Informações Gerais</h2>
                {/* BOTÃO DE EDIÇÃO DESTAQUE */}
                <button
                    className={isEditingInfo ? styles.btnHighlight : styles.btnHighlight}
                    onClick={() => {
                        if(isEditingInfo) setEditForm(abrigo); // Resetar ao cancelar
                        setIsEditingInfo(!isEditingInfo);
                    }}
                >
                    {isEditingInfo ? 'Cancelar Edição' : '✏️ Editar Informações'}
                </button>
            </div>

            {!isEditingInfo ? (
                /* VIEW MODE (Visual igual ao usuário) */
                <div className={styles.cardContent}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoBlock}>
                            <h3>📍 Endereço</h3>
                            <p>{abrigo.endereco}</p>
                            <p className={styles.textMuted}>{abrigo.cidade} - {abrigo.estado}</p>
                        </div>
                        <div className={styles.infoBlock}>
                            <h3>📞 Contato</h3>
                            <p>Resp: {abrigo.contato_responsavel || '-'}</p>
                            {abrigo.telefone && <p className={styles.iconText}>📞 {abrigo.telefone}</p>}
                            {abrigo.email && <p className={styles.iconText}>✉️ {abrigo.email}</p>}
                        </div>
                        <div className={styles.infoBlock}>
                            <h3>⚙️ Operação</h3>
                            <p>Horário: {abrigo.horario_funcionamento || '-'}</p>
                            <p>
                                <span className={abrigo.vagas_disponiveis > 0 ? styles.availableStatus : styles.fullStatus}>
                                    {abrigo.vagas_disponiveis} vagas livres
                                </span>
                                <span className={styles.textMuted}> / {abrigo.capacidade_total} total</span>
                            </p>
                        </div>
                        <div className={styles.infoBlock}>
                            <h3>Avaliação</h3>
                            <p>{meanRating} ⭐ <span className={styles.textMuted}>({reviews.length})</span></p>
                        </div>
                        <div className={styles.infoBlock} style={{ gridColumn: '1 / -1' }}>
                            <h3>Aceita</h3>
                            <div className={styles.tags}>
                                {abrigo.aceita_pets && <span className={styles.tagPets}>🐾 Pets</span>}
                                {abrigo.tipo_feminino && <span className={styles.tagFeminino}>Mulheres</span>}
                                {abrigo.tipo_masculino && <span className={styles.tagMasculino}>Homens</span>}
                            </div>
                        </div>
                    </div>

                    {/* Mapa (Visível apenas em View Mode) */}
                    <div className={styles.mapColumn}>
                        <div className={styles.mapLabel}>Localização no mapa</div>
                        <div className={styles.mapContainer}>
                            {(abrigo.latitude || abrigo.lat) ? (
                                <Map shelters={[abrigo]} />
                            ) : (
                                <div className={styles.noMapData}>Sem localização</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* EDIT MODE (Formulário Completo) */
                <form onSubmit={handleSaveInfo} className={styles.editFormContainer}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Nome do Abrigo</label>
                            <input name="nome" value={editForm.nome || ''} onChange={handleEditChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Tipo de Operação</label>
                            <select name="tipo" value={editForm.tipo || ''} onChange={handleEditChange}>
                                <option value="temporario">Temporário</option>
                                <option value="permanente">Permanente</option>
                                <option value="emergencia">Emergência</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Endereço Completo</label>
                        <input name="endereco" value={editForm.endereco || ''} onChange={handleEditChange} required />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Capacidade Total</label>
                            <input type="number" name="capacidade_total" value={editForm.capacidade_total || ''} onChange={handleEditChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Vagas Disponíveis</label>
                            <input type="number" name="vagas_disponiveis" value={editForm.vagas_disponiveis || ''} onChange={handleEditChange} />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Responsável</label>
                            <input name="contato_responsavel" value={editForm.contato_responsavel || ''} onChange={handleEditChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Telefone</label>
                            <input name="telefone" value={editForm.telefone || ''} onChange={handleEditChange} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input name="email" value={editForm.email || ''} onChange={handleEditChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Horário de Funcionamento</label>
                        <input name="horario_funcionamento" value={editForm.horario_funcionamento || ''} onChange={handleEditChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Descrição</label>
                        <textarea name="descricao" value={editForm.descricao || ''} onChange={handleEditChange} rows="3" />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Restrições</label>
                        <textarea name="restricoes" value={editForm.restricoes || ''} onChange={handleEditChange} rows="2" />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Opções de Acolhimento</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{display:'flex', alignItems:'center', gap:'5px'}}><input type="checkbox" checked={!!editForm.aceita_pets} onChange={() => handleCheckboxChange('Pets')} /> Aceita Pets</label>
                            <label style={{display:'flex', alignItems:'center', gap:'5px'}}><input type="checkbox" checked={!!editForm.tipo_feminino} onChange={() => handleCheckboxChange('Feminino')} /> Mulheres</label>
                            <label style={{display:'flex', alignItems:'center', gap:'5px'}}><input type="checkbox" checked={!!editForm.tipo_masculino} onChange={() => handleCheckboxChange('Masculino')} /> Homens</label>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="submit" className={styles.btnHighlight} disabled={savingInfo}>
                            {savingInfo ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            )}

            {/* Bloco de Descrição/Restrições (Visível apenas no modo leitura se existir) */}
            {!isEditingInfo && (abrigo.descricao || abrigo.restricoes) && (
                <div className={styles.detailsSection}>
                    {abrigo.descricao && <div className={styles.detailBlock}><h3>Sobre</h3><p>{abrigo.descricao}</p></div>}
                    {abrigo.restricoes && <div className={styles.detailBlock}><div className={styles.alertBox}><p>⚠️ {abrigo.restricoes}</p></div></div>}
                </div>
            )}
        </div>

        {/* --- NEEDS MANAGEMENT --- */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2>Necessidades</h2>
                <button className={styles.btnHighlight} onClick={() => setShowAddNeed(true)}>+ Adicionar</button>
            </div>

            {showAddNeed && (
                <div className={styles.addForm}>
                    <form onSubmit={handleAddNeed}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Item</label>
                                <input value={newNeed.item} onChange={e => setNewNeed({...newNeed, item: e.target.value})} required placeholder="Ex: Cobertores"/>
                            </div>
                            <div className={styles.formGroup}>
				    <label>Nível de Necessidade</label>
				    <select
					value={newNeed.nivel}
					onChange={(e) => setNewNeed({ ...newNeed, nivel: e.target.value })}
					className={styles.input} // Use sua classe de estilo de input
				    >
				    <option value="urgente">Urgente</option>
				    <option value="em_falta">Em Falta</option>
				    <option value="suficiente">Suficiente</option>
				    <option value="em_excesso">Em Excesso</option>
				    </select>
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button type="submit" className={styles.btnHighlight}>Salvar</button>
                            <button type="button" className={styles.btnHighlight} onClick={() => setShowAddNeed(false)}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            <ul className={styles.needsList}>
                {necessidades.length > 0 ? necessidades.map(need => (
                    <li key={need.id} className={styles.needItem}>
                        {editingNeed === need.id ? (
                             <EditNeedForm need={need} onSave={(u) => handleUpdateNeed(need.id, u)} onCancel={() => setEditingNeed(null)} />
                        ) : (
                            <div className={styles.needContent}>
                                <div>
                                    <span className={styles.itemName}>{need.item}</span>
				    <span className={`${styles.levelBadge} ${styles['level-' + need.nivel]}`}>
					{need.nivel.replace('_', ' ')}
				    </span>
                                </div>
                                <div className={styles.needActions}>
                                    <button className={styles.btnHighlight} onClick={() => setEditingNeed(need.id)}>Editar</button>
                                    <button className={styles.btnHighlight} onClick={() => handleDeleteNeed(need.id)}>Remover</button>
                                </div>
                            </div>
                        )}
                    </li>
                )) : <p className={styles.emptyState}>Nenhuma necessidade cadastrada.</p>}
            </ul>
        </div>

        {/* --- REVIEWS CARD (Read Only) --- */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2>Avaliações Recebidas</h2>
            </div>
            <div className={styles.reviewsList}>
                {reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                            <span className={styles.reviewRating}>{'⭐'.repeat(review.nota)}</span>
                            <span className={styles.reviewDate}>{new Date(review.data_avaliacao).toLocaleDateString()}</span>
                        </div>
                        <p className={styles.reviewComment}>{review.comentario}</p>
                    </div>
                )) : <p className={styles.emptyState}>Nenhuma avaliação ainda.</p>}
            </div>
        </div>

        {/* --- DONATIONS CARD (Read Only) --- */}
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h2>Histórico de Doações</h2>
            </div>
            <ul className={styles.donationsList}>
                {donations.length > 0 ? donations.map(d => (
                    <li key={d.id} className={styles.donationListItem}>
                        <div>
                            <span className={styles.donorName}>{d.doador_nome}</span> doou <strong>{d.quantidade_doada} {d.item_nome}</strong>
                        </div>
                        <span className={styles.donationDate}>{new Date(d.data_doacao).toLocaleDateString()}</span>
                    </li>
                )) : <p className={styles.emptyState}>Nenhuma doação registrada.</p>}
            </ul>
        </div>

      </main>
    </div>
  );
}

// Componente auxiliar para o formulário de edição de necessidade
function EditNeedForm({ need, onSave, onCancel }) {

    const [data, setData] = useState({ item: need.item, nivel: need.nivel || 'em_falta' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} style={{width: '100%', display:'flex', gap:'1rem', alignItems:'center'}}>
            <input
		className={styles.input}
                value={data.item}
                onChange={e => setData({...data, item: e.target.value})}
                style={{flex:1, padding:'0.5rem', borderRadius:'6px', border:'1px solid #ccc'}}
                required
            />
            {/* Novo Select de Nível */}
            <select
                value={data.nivel}
                onChange={e => setData({...data, nivel: e.target.value})}
                style={{width:'140px', padding:'0.5rem', borderRadius:'6px', border:'1px solid #ccc'}}
            >
                <option value="urgente">Urgente</option>
                <option value="em_falta">Em Falta</option>
                <option value="suficiente">Suficiente</option>
                <option value="em_excesso">Excesso</option>
            </select>

            <div style={{display:'flex', gap:'0.5rem'}}>
                <button type="submit" className={styles.btnHighLight}>OK</button>
                <button type="button" className={styles.btnHighLight} onClick={onCancel}>X</button>
            </div>
        </form>
    );
}
