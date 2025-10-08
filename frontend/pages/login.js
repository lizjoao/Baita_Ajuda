import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erros quando usuário digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };


  
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      console.log('Login attempt for:', formData.email);

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          senha: formData.senha
        }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // Salva os dados do usuário no localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');

      console.log('Login successful for:', data.user.email);
      
      // Redireciona para página inicial
      router.push('/');

    } catch (error) {
      console.error('Login error:', error.message);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login - Baita Ajuda</title>
        <meta name="description" content="Faça login no Baita Ajuda" />
      </Head>
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>
            <Link href="/">Baita Ajuda</Link>
          </h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.loginContainer}>
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <h2>Entrar na Conta</h2>
            
            {/* Erro da API */}
            {apiError && (
              <div className={styles.errorBanner}>
                {apiError}
              </div>
            )}

            {/* Campo Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles.inputError : ''}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
              {errors.email && (
                <span className={styles.errorMsg}>{errors.email}</span>
              )}
            </div>

            {/* Campo Senha */}
            <div className={styles.formGroup}>
              <label htmlFor="senha">Senha</label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className={errors.senha ? styles.inputError : ''}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
              />
              {errors.senha && (
                <span className={styles.errorMsg}>{errors.senha}</span>
              )}
            </div>

            {/* Botão Submit */}
            <button 
              type="submit" 
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Links */}
          <div className={styles.loginLinks}>
            <p>
              Não tem uma conta?{' '}
              <Link href="/register">
                Registre-se aqui
              </Link>
            </p>
            <p>
              <Link href="/">
                Voltar ao início
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}