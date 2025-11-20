import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import styles from '../styles/Form.module.css'

export default function AddShelter() {
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
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
      const response = await fetch('http://localhost:5000/api/abrigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: user.id,
          nome,
          endereco,
          vagas_disponiveis: parseInt(vagasDisponiveis) || 0,
          formulario_inscricao_url: formularioUrl || null,
          tipo_abrigo: tipoAbrigo
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/manage-shelters')
      } else {
        setError(data.error || 'Erro ao criar abrigo')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
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
                required
                className={styles.textarea}
                placeholder="Endereço completo do abrigo"
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
