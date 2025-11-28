import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../components/Header';
import styles from '../styles/ShelterDetails.module.css';

export default function ShelterDetails() {
    const [abrigo, setAbrigo] = useState(null);
    const [necessidades, setNecessidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // States for Needs
    const [showAddNeed, setShowAddNeed] = useState(false);
    const [newNeed, setNewNeed] = useState({ item: '', quantidade: '' });
    const [editingNeed, setEditingNeed] = useState(null);

    // States for Editing Shelter Info
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [infoError, setInfoError] = useState('');

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
                    setEditForm(data.abrigo);
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

    // --- SHELTER INFO EDIT HANDLERS ---

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
        setInfoError('');

        try {
            const tipoAbrigoArray = [];
            if (editForm.aceita_pets) tipoAbrigoArray.push('Pets');
            if (editForm.tipo_feminino) tipoAbrigoArray.push('Feminino');
            if (editForm.tipo_masculino) tipoAbrigoArray.push('Masculino');

            const payload = {
                ...editForm,
                tipo_abrigo: tipoAbrigoArray
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
                setInfoError(data.error || 'Erro ao atualizar informações');
            }
        } catch (err) {
            setInfoError('Erro de conexão.');
        }
    };

    // --- NEEDS HANDLERS ---

    const handleAddNeed = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            alert('Erro ao adicionar necessidade');
        }
    };

    const handleUpdateNeed = async (needId, updatedNeed) => {
        try {
            const response = await fetch(`http://localhost:5000/api/necessidades/${needId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            alert('Erro ao atualizar necessidade');
        }
    };

    const handleDeleteNeed = async (needId) => {
        if (!confirm('Tem certeza que deseja remover esta necessidade?')) return;

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
                    <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => router.push('/manage-shelters')}
                    >
                        Voltar
                    </button>
                </div>

                <div className={styles.content}>

                    {/* 💡 AQUI ESTÁ O BOTÃO DE EDIÇÃO */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h4>Informações do Abrigo</h4>
                            <button
                                className={`${styles.btn} ${isEditingInfo ? styles.btnSecondary : styles.btnPrimary}`}
                                onClick={() => {
                                    if(isEditingInfo) setEditForm(abrigo); // Reset on cancel
                                    setIsEditingInfo(!isEditingInfo);
                                }}
                            >
                                {isEditingInfo ? 'Cancelar Edição' : 'Editar Informações'}
                            </button>
                        </div>

                        {infoError && <p className={styles.error}>{infoError}</p>}

                        {!isEditingInfo ? (
                            // VIEW MODE
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <strong>Endereço</strong>
                                    <span>{abrigo.endereco}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Cidade/Estado</strong>
                                    <span>{abrigo.cidade} - {abrigo.estado}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Contato</strong>
                                    <span>{abrigo.contato_responsavel || '-'}</span>
                                    <span>{abrigo.telefone || '-'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Capacidade</strong>
                                    <span>Total: {abrigo.capacidade_total}</span>
                                    <span>Livres: {abrigo.vagas_disponiveis}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Aceita</strong>
                                    <div>
                                        {abrigo.aceita_pets && <span>Pets </span>}
                                        {abrigo.tipo_feminino && <span>Feminino </span>}
                                        {abrigo.tipo_masculino && <span>Masculino </span>}
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Horário</strong>
                                    <span>{abrigo.horario_funcionamento || 'Não informado'}</span>
                                </div>
                                {abrigo.descricao && (
                                    <div className={styles.infoItem} style={{ gridColumn: '1/-1' }}>
                                        <strong>Descrição</strong>
                                        <p>{abrigo.descricao}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // EDIT MODE FORM
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
                                    <label>Endereço</label>
                                    <input name="endereco" value={editForm.endereco || ''} onChange={handleEditChange} required />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Cidade</label>
                                        <input name="cidade" value={editForm.cidade || ''} onChange={handleEditChange} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Estado</label>
                                        <input name="estado" value={editForm.estado || ''} onChange={handleEditChange} />
                                    </div>
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
                                    <textarea
                                        name="descricao"
                                        value={editForm.descricao || ''}
                                        onChange={handleEditChange}
                                        rows="3"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Restrições</label>
                                    <textarea
                                        name="restricoes"
                                        value={editForm.restricoes || ''}
                                        onChange={handleEditChange}
                                        rows="2"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{marginTop: '1rem'}}>
                                    <label>Opções de Acolhimento</label>
                                    <div style={{display:'flex', gap:'1rem', marginTop:'0.5rem'}}>
                                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:'normal'}}>
                                            <input type="checkbox" checked={!!editForm.aceita_pets} onChange={() => handleCheckboxChange('Pets')} /> Aceita Pets
                                        </label>
                                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:'normal'}}>
                                            <input type="checkbox" checked={!!editForm.tipo_feminino} onChange={() => handleCheckboxChange('Feminino')} /> Feminino
                                        </label>
                                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:'normal'}}>
                                            <input type="checkbox" checked={!!editForm.tipo_masculino} onChange={() => handleCheckboxChange('Masculino')} /> Masculino
                                        </label>
                                    </div>
                                </div>

                                <div className={styles.formActions} style={{marginTop:'2rem'}}>
                                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Salvar Alterações</button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* NEEDS CARD */}
                    <div className={styles.needsCard}>
                        <div className={styles.cardHeader}>
                            <h4>Necessidades do Abrigo</h4>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => setShowAddNeed(true)}
                            >
                                + Adicionar Necessidade
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
                                                placeholder="Ex: Cobertores, Alimentos..."
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
                                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                                            Salvar Item
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
                    <label>Item</label>
                    <input
                        type="text"
                        value={editData.item}
                        onChange={(e) => setEditData({ ...editData, item: e.target.value })}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Quantidade</label>
                    <input
                        type="text"
                        value={editData.quantidade}
                        onChange={(e) => setEditData({ ...editData, quantidade: e.target.value })}
                        required
                    />
                </div>
            </div>
            <div className={styles.formActions}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Salvar Alterações
                </button>
            </div>
        </form>
    );
}
