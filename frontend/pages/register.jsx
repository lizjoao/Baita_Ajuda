import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import Header from '../components/Header'
import styles from '../styles/Auth.module.css'

export default function Register() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return false
    }
    if (senha.length < 6) {
      setError('Senha muito curta')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setError('')

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/manage-shelters')
      } else {
        setError(data.error || 'Erro ao criar conta')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Registrar - Baita Ajuda</title>
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtitle}>Junte-se a nós e ajude a comunidade</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>Nome completo</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className={styles.input}
                placeholder="Seu nome"
              />
            </div>

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
                minLength={6}
                className={styles.input}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmarSenha" className={styles.label}>Confirmar senha</label>
              <input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                className={styles.input}
                placeholder="Digite a senha novamente"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className={styles.link}>
            Já tem uma conta? <Link href="/login">Entre aqui</Link>
          </p>
        </div>
      </main>
    </div>
  )
}