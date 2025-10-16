import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import apiService from '../services/api';
import styles from '../styles/Register.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
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
    try {
      console.log('Registering user:', formData.email);
      
      const result = await apiService.register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha
      });

      console.log('Registration successful:', result.user);
      alert('Conta criada com sucesso!');
      router.push('/login');

    } catch (error) {
      console.error('Registration error:', error.message);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Registro - Baita Ajuda</title>
      </Head>
      
      <header className={styles.header}>
        <h1><Link href="/">Baita Ajuda</Link></h1>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2>Criar Conta</h2>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Nome</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={errors.nome ? styles.error : ''}
                required
              />
              {errors.nome && <span className={styles.errorMsg}>{errors.nome}</span>}
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles.error : ''}
                required
              />
              {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label>Senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className={errors.senha ? styles.error : ''}
                required
              />
              {errors.senha && <span className={styles.errorMsg}>{errors.senha}</span>}
            </div>

            <div className={styles.field}>
              <label>Confirmar Senha</label>
              <input
                type="password"
                name="confirmarSenha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                className={errors.confirmarSenha ? styles.error : ''}
                required
              />
              {errors.confirmarSenha && <span className={styles.errorMsg}>{errors.confirmarSenha}</span>}
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </button>
          </form>

          <p>Já tem conta? <Link href="/login">Faça login</Link></p>
        </div>
      </main>
    </div>
  );
}