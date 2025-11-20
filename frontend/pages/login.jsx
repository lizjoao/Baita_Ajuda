import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import Header from '../components/Header'
import styles from '../styles/Auth.module.css'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const login = async (email, senha) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/manage-shelters')
      } else {
        setError(data.error || 'Erro ao fazer login')
      }
    } catch {
      setError('Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, login }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const { loading, error, login } = useAuth()
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    login(email, senha)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Login - Baita Ajuda</title>
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Bem-vindo de volta!</h1>
          <p className={styles.subtitle}>Entre para gerenciar seus abrigos</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="seu@email.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="senha" className={styles.label}>Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className={styles.link}>
            Não tem uma conta? <Link href="/register">Registre-se aqui</Link>
          </p>
        </div>
      </main>
    </div>
  )
}