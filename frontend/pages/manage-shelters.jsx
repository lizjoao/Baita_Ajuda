import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import Header from '../components/Header'
import styles from '../styles/Manage.module.css'

export default function ManageShelters() {
  const [shelters, setShelters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    
    const user = JSON.parse(userData)
    setUser(user)
    
    // Buscar abrigos direto
    fetchShelters(user.id)
  }, [router])

  const fetchShelters = async (userId) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/user/${userId}`)
      const data = await response.json()

      if (data.success) {
        setShelters(data.abrigos)
      } else {
        setError(data.error || 'Erro ao buscar abrigos')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este abrigo?')) return

    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setShelters(shelters.filter(s => s.id !== id))
      } else {
        alert(data.error || 'Erro ao deletar abrigo')
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Gerenciar Abrigos - Baita Ajuda</title>
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Meus Abrigos</h1>
            {user && <p className={styles.subtitle}>Bem-vindo, {user.nome}!</p>}
          </div>
          <div className={styles.actions}>
            <Link href="/add-shelter" className={`${styles.button} ${styles.buttonPrimary}`}>
              + Adicionar Abrigo
            </Link>
            <button onClick={handleLogout} className={`${styles.button} ${styles.buttonSecondary}`}>
              Sair
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Carregando abrigos...</div>
        ) : shelters.length === 0 ? (
          <div className={styles.empty}>
            <p>Você ainda não cadastrou nenhum abrigo.</p>
            <Link href="/add-shelter" className={`${styles.button} ${styles.buttonPrimary}`}>
              Cadastrar primeiro abrigo
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {shelters.map(shelter => (
              <div key={shelter.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{shelter.nome}</h3>
                  <div className={styles.cardActions}>
                    <Link href={`/edit-shelter/${shelter.id}`} className={styles.iconButton}>
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(shelter.id)}
                      className={`${styles.iconButton} ${styles.deleteButton}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <p className={styles.cardText}>📍 {shelter.endereco}</p>
                <p className={styles.cardText}>
                  <strong>Vagas:</strong> {shelter.vagas_disponiveis}
                </p>

                <div className={styles.tags}>
                  {shelter.aceita_pets && <span className={styles.tag}>🐾 Pets</span>}
                  {shelter.tipo_feminino && <span className={styles.tag}>Feminino</span>}
                  {shelter.tipo_masculino && <span className={styles.tag}>Masculino</span>}
                </div>

                {shelter.formulario_inscricao_url && (
                  <a 
                    href={shelter.formulario_inscricao_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    Ver formulário →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}