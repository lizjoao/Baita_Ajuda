import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/AddShelter.module.css';

export default function AddShelter() {
  const [formData, setFormData] = useState({
    nome: '',
    rua: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    tipo_abrigo: '',
    vagas_disponiveis: '',
    formulario_inscricao_url: ''
  });
  const [loading, setLoading] = useState(false);
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
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para formatar CEP
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 5) {
      value = value.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }
    setFormData(prev => ({
      ...prev,
      cep: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Montar o endereço completo
      const enderecoCompleto = `${formData.rua}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - CEP: ${formData.cep}`.trim();

      const response = await fetch('http://localhost:5000/api/abrigos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          endereco: enderecoCompleto,
          tipo_abrigo: formData.tipo_abrigo,
          vagas_disponiveis: formData.vagas_disponiveis,
          formulario_inscricao_url: formData.formulario_inscricao_url,
          usuario_id: user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Abrigo cadastrado com sucesso!');
          router.push('/manage-shelters');
        } else {
          alert('Erro ao cadastrar abrigo: ' + data.error);
        }
      } else {
        const errorData = await response.json();
        alert('Erro ao cadastrar abrigo: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao cadastrar abrigo:', error);
      alert('Erro ao cadastrar abrigo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className={styles.loading}>Carregando...</div>;
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
        <div className={styles.formContainer}>
          <div className={styles.formContent}>
            <h2>Adicionar Novo Abrigo</h2>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">
                  Nome do Abrigo *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Digite o nome do abrigo"
                />
              </div>

              {/* Seção de Endereço */}
              <div className={styles.addressSection}>
                <h3>Endereço</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="rua">
                      Rua *
                    </label>
                    <input
                      type="text"
                      id="rua"
                      name="rua"
                      value={formData.rua}
                      onChange={handleInputChange}
                      required
                      placeholder="Nome da rua"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="numero">
                      Número *
                    </label>
                    <input
                      type="text"
                      id="numero"
                      name="numero"
                      value={formData.numero}
                      onChange={handleInputChange}
                      required
                      placeholder="Nº"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="bairro">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      id="bairro"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleInputChange}
                      required
                      placeholder="Nome do bairro"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="cep">
                      CEP *
                    </label>
                    <input
                      type="text"
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      required
                      placeholder="00000-000"
                      maxLength="9"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cidade">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tipo_abrigo">
                  Tipo do Abrigo
                </label>
                <select
                  id="tipo_abrigo"
                  name="tipo_abrigo"
                  value={formData.tipo_abrigo}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Pets">Pets</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="vagas_disponiveis">
                  Vagas Disponíveis *
                </label>
                <input
                  type="number"
                  id="vagas_disponiveis"
                  name="vagas_disponiveis"
                  value={formData.vagas_disponiveis}
                  onChange={handleInputChange}
                  min="0"
                  required
                  placeholder="Número de vagas disponíveis"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="formulario_inscricao_url">
                  URL do Formulário de Inscrição
                </label>
                <input
                  type="url"
                  id="formulario_inscricao_url"
                  name="formulario_inscricao_url"
                  value={formData.formulario_inscricao_url}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com/formulario"
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => router.push('/manage-shelters')}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Abrigo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
