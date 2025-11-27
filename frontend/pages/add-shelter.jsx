import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import styles from '../styles/Form.module.css'
import dynamic from 'next/dynamic'

// 💡 Dynamic Import do Map Component
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Carregando mapa...</div>
})

export default function AddShelter() {
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [vagasDisponiveis, setVagasDisponiveis] = useState('')
  const [formularioUrl, setFormularioUrl] = useState('')
  const [tipoAbrigo, setTipoAbrigo] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 💡 NOVOS ESTADOS PARA O SCHEMA COMPLETO
  const [capacidadeTotal, setCapacidadeTotal] = useState('')
  const [contatoResponsavel, setContatoResponsavel] = useState('')
  const [telefone, setTelefone] = useState('')
  const [emailContato, setEmailContato] = useState('')
  const [descricao, setDescricao] = useState('')
  const [restricoes, setRestricoes] = useState('')
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('')
  const [tipoGeral, setTipoGeral] = useState('') // for 'tipo' column: temporario, permanente, emergencia

  // 💡 NOVOS ESTADOS PARA COORDENADAS E VISUALIZAÇÃO
  const [fetchedLat, setFetchedLat] = useState(null)
  const [fetchedLng, setFetchedLng] = useState(null)
  const [showCoords, setShowCoords] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/login')
    }
  }, [router])

  const handleTipoChange = (tipo) => {
    setTipoAbrigo(prev =>
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const user = JSON.parse(localStorage.getItem('user'))

  try {
      // 💡 ATUALIZADO: Chama a função para buscar coordenadas
      const coords = await handleFetchCoords({ silent: true })

      // build basic payload
      const bodyPayload = {
        usuario_id: user.id,
        nome,
        endereco,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,

        // NOVOS CAMPOS
        tipo: tipoGeral || 'temporario',
        capacidade_total: parseInt(capacidadeTotal) || 0,
        contato_responsavel: contatoResponsavel || null,
        telefone: telefone || null,
        email: emailContato || null,
        descricao: descricao || null,
        restricoes: restricoes || null,
        horario_funcionamento: horarioFuncionamento || null,

        vagas_disponiveis: parseInt(vagasDisponiveis) || 0,
        formulario_inscricao_url: formularioUrl || null,
        tipo_abrigo: tipoAbrigo // Includes aceita_pets, tipo_feminino, tipo_masculino flags
      };

      // 💡 USA AS COORDENADAS DO ESTADO (ou o resultado da última busca) para o payload
      if (fetchedLat && fetchedLng) {
        bodyPayload.latitude = fetchedLat
        bodyPayload.longitude = fetchedLng
      } else if (coords && coords.lat && coords.lon) {
        bodyPayload.latitude = parseFloat(coords.lat)
        bodyPayload.longitude = parseFloat(coords.lon)
      }


      const response = await fetch('http://localhost:5000/api/abrigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })

      const data = await response.json()

      if (data.success) {
        router.replace('/')
      } else {
        setError(data.error || 'Erro ao criar abrigo')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  // Try to fetch coordinates from backend geocode proxy
  const handleFetchCoords = async ({ silent = false } = {}) => {
    // 💡 CORREÇÃO: A busca deve ser feita se ENDEREÇO OU CEP estiverem preenchidos.
    if ((!endereco || !endereco.trim()) && (!cep || !cep.trim())) {
      if (!silent) setError('Preencha o endereço ou o CEP antes de buscar coordenadas.')
      // Limpa as coordenadas anteriores ao falhar
      setFetchedLat(null)
      setFetchedLng(null)
      setShowCoords(false)
      return false
    }

    setError('')
    setLoading(true)
    try {
      let query = endereco.trim()
      if (cep && cep.trim()) {
        query = cep.trim()
      } else {
        const parts = [endereco.trim()]
        if (cidade && cidade.trim()) parts.push(cidade.trim())
        if (estado && estado.trim()) parts.push(estado.trim())
        query = parts.join(', ')
      }

      const url = `http://localhost:5000/api/geocode?q=${encodeURIComponent(query)}`
      const resp = await fetch(url)
      const j = await resp.json()

      if (!j.success || !j.lat || !j.lon) {
        if (!silent) setError(j.error || 'Falha ao obter coordenadas')
        // 💡 ATUALIZAÇÃO: Limpa e retorna falha
        setFetchedLat(null)
        setFetchedLng(null)
        setShowCoords(false)
        setLoading(false)
        return null
      }

      // 💡 SUCESSO: Armazena e mostra coordenadas
      const lat = parseFloat(j.lat);
      const lon = parseFloat(j.lon);

      setFetchedLat(lat)
      setFetchedLng(lon)
      setShowCoords(true)

      return { lat, lon }
    } catch (err) {
      if (!silent) setError('Erro ao tentar buscar coordenadas no servidor')
      setLoading(false)
      return null
    } finally {
      // Garante que o loading seja falso se não houver erro
      if (!error) setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Adicionar Abrigo - Baita Ajuda</title>
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Adicionar Novo Abrigo</h1>
          <p className={styles.subtitle}>Preencha as informações do abrigo</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Campos de Nome e Endereço */}
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>
                Nome do Abrigo<span className={styles.required}>*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className={styles.input}
                placeholder="Ex: Abrigo Central Porto Alegre"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="endereco" className={styles.label}>
                Endereço<span className={styles.required}>*</span>
              </label>
              <textarea
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                onBlur={() => { handleFetchCoords({ silent: true }) }}
                required
                className={styles.textarea}
                placeholder="Endereço completo do abrigo"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="cep" className={styles.label}>CEP (opcional)</label>
                <input
                  id="cep"
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={() => { handleFetchCoords({ silent: true }) }}
                  className={styles.input}
                  placeholder="Ex: 90010-000"
                />
                <span className={styles.hint}>Se preenchido, será usado prioritariamente para geocodificação</span>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cidade" className={styles.label}>Cidade (opcional)</label>
                <input
                  id="cidade"
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className={styles.input}
                  placeholder="Ex: Porto Alegre"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="estado" className={styles.label}>Estado (opcional)</label>
              <input
                id="estado"
                type="text"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={styles.input}
                placeholder="Ex: RS"
              />
            </div>

            {/* 💡 PRÉ-VISUALIZAÇÃO DA LOCALIZAÇÃO ENCONTRADA */}
            {showCoords && fetchedLat && fetchedLng && (
                <div className={styles.geocodedPreview}>
                    <h3 className={styles.previewTitle}>Localização Encontrada:</h3>
                    <p className={styles.coordText}>
                        Latitude: <strong>{fetchedLat.toFixed(6)}</strong>,
                        Longitude: <strong>{fetchedLng.toFixed(6)}</strong>
                    </p>
                    <div className={styles.mapPreviewContainer}>
                        <Map shelters={[{ lat: fetchedLat, lng: fetchedLng, id: 'preview' }]} />
                    </div>
                    <span className={styles.hint}>Confirme se o marcador está no local correto. Esta coordenada será usada na submissão.</span>
                </div>
            )}
            {/* FIM PRÉ-VISUALIZAÇÃO */}

            {/* --- General Type, Capacity, and Vagas --- */}
            <div className={styles.formGroup}>
              <label htmlFor="tipoGeral" className={styles.label}>
                Tipo de Operação<span className={styles.required}>*</span>
              </label>
              <select
                id="tipoGeral"
                value={tipoGeral}
                onChange={(e) => setTipoGeral(e.target.value)}
                required
                className={styles.input} // Reusing .input style for select
              >
                <option value="">Selecione o Tipo</option>
                <option value="temporario">Temporário</option>
                <option value="permanente">Permanente</option>
                <option value="emergencia">Emergência</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="capacidadeTotal" className={styles.label}>Capacidade Total</label>
                <input
                  id="capacidadeTotal"
                  type="number"
                  value={capacidadeTotal}
                  onChange={(e) => setCapacidadeTotal(e.target.value)}
                  min="0"
                  className={styles.input}
                  placeholder="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="vagas" className={styles.label}>
                  Vagas Disponíveis
                </label>
                <input
                  id="vagas"
                  type="number"
                  value={vagasDisponiveis}
                  onChange={(e) => setVagasDisponiveis(e.target.value)}
                  min="0"
                  className={styles.input}
                  placeholder="0"
                />
                <span className={styles.hint}>Vagas livres no momento</span>
              </div>
            </div>
            {/* --- End General Type/Capacity/Vagas --- */}

            {/* --- NOVO: Informações de Contato --- */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Informações de Contato</label>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="responsavel" className={styles.label}>Responsável</label>
                  <input
                    id="responsavel"
                    type="text"
                    value={contatoResponsavel}
                    onChange={(e) => setContatoResponsavel(e.target.value)}
                    className={styles.input}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="telefone" className={styles.label}>Telefone</label>
                  <input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={styles.input}
                    placeholder="(XX) XXXX-XXXX"
                  />
                </div>
              </div>

              <input
                id="emailContato"
                type="email"
                value={emailContato}
                onChange={(e) => setEmailContato(e.target.value)}
                className={styles.input}
                placeholder="Email de contato"
              />
            </div>
            {/* --- FIM: Informações de Contato --- */}

            {/* --- Horário de Funcionamento --- */}
            <div className={styles.formGroup}>
              <label htmlFor="horarioFuncionamento" className={styles.label}>Horário de Funcionamento</label>
              <input
                id="horarioFuncionamento"
                type="text"
                value={horarioFuncionamento}
                onChange={(e) => setHorarioFuncionamento(e.target.value)}
                className={styles.input}
                placeholder="Ex: 24h, 08h às 22h, etc."
              />
            </div>

            {/* --- URL Formulário (Original Position) --- */}
            <div className={styles.formGroup}>
              <label htmlFor="url" className={styles.label}>
                URL do Formulário de Inscrição
              </label>
              <input
                id="url"
                type="url"
                value={formularioUrl}
                onChange={(e) => setFormularioUrl(e.target.value)}
                className={styles.input}
                placeholder="https://..."
              />
              <span className={styles.hint}>Link para formulário online (opcional)</span>
            </div>

            {/* --- Description and Restrictions (TEXTAREAS) --- */}
            <div className={styles.formGroup}>
              <label htmlFor="descricao" className={styles.label}>Descrição Detalhada</label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={styles.textarea}
                placeholder="Detalhes sobre a estrutura, o que o abrigo oferece e quem ele atende."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="restricoes" className={styles.label}>Restrições e Regras</label>
              <textarea
                id="restricoes"
                value={restricoes}
                onChange={(e) => setRestricoes(e.target.value)}
                className={styles.textarea}
                placeholder="Ex: Não aceita fumantes, Necessário documento de identidade, etc."
              />
            </div>

            {/* --- Tipo de Abrigo (Flags) --- */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Público/Flags</label>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={tipoAbrigo.includes('Feminino')}
                    onChange={() => handleTipoChange('Feminino')}
                  />
                  <span>Feminino</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={tipoAbrigo.includes('Masculino')}
                    onChange={() => handleTipoChange('Masculino')}
                  />
                  <span>Masculino</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={tipoAbrigo.includes('Pets')}
                    onChange={() => handleTipoChange('Pets')}
                  />
                  <span>Aceita Pets 🐾</span>
                </label>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                className={`${styles.button} ${styles.buttonSecondary}`}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {loading ? 'Criando...' : 'Criar Abrigo'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
