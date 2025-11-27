import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import styles from '../styles/Form.module.css'

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
      // build basic payload
      const bodyPayload = {
        usuario_id: user.id,
        nome,
        endereco,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        vagas_disponiveis: parseInt(vagasDisponiveis) || 0,
        formulario_inscricao_url: formularioUrl || null,
        tipo_abrigo: tipoAbrigo
      };

      // attempt to geocode silently (we no longer show latitude/longitude inputs)
      const coords = await handleFetchCoords({ silent: true })
      if (coords && coords.lat && coords.lon) {
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
        // Redirect to home so the map will re-fetch and display the new shelter
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
    if (!endereco || !endereco.trim()) {
      if (!silent) setError('Preencha o endereço antes de buscar coordenadas.')
      return false
    }

    setError('')
    setLoading(true)
    try {
      // Build a smart query: prefer CEP if provided, otherwise combine address + city + state
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
      if (!j.success) {
        if (!silent) setError(j.error || 'Falha ao obter coordenadas')
        setLoading(false)
        return null
      }

      // Fill the inputs with the found coords and return them
      return { lat: j.lat, lon: j.lon }
    } catch (err) {
      if (!silent) setError('Erro ao tentar buscar coordenadas no servidor')
      return null
    } finally {
      setLoading(false)
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

            <div className={styles.formGroup}>
              <label htmlFor="cep" className={styles.label}>CEP (opcional)</label>
              <input
                id="cep"
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
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
              <span className={styles.hint}>Deixe em branco se não souber</span>
            </div>

            {/* latitude/longitude inputs removed — coordinates are fetched automatically via backend geocode */}

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

            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Abrigo</label>
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
