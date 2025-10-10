import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/AddShelter.module.css'

export default function AddShelter() {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    tipo_abrigo: [],
    vagas_disponiveis: '',
    formulario_inscricao_url: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const router = useRouter()
  const opcoesDeAbrigo = [
      { value: "Feminino", label: "Feminino" },
      { value: "Masculino", label: "Masculino" },
      { value: "Pets", label: "Pets" },
  ];

  const shelterTypes = {
      aceita_pets: false,
      tipo_feminino: false,
      tipo_masculino: false,
  };

 const selectedTypes = formData.tipo_abrigo;

 for (const type of selectedTypes) {
     if (type === 'Pets') shelterTypes.aceita_pets = true;
     if (type === 'Feminino') shelterTypes.tipo_feminino = true;
     if (type === 'Masculino') shelterTypes.tipo_masculino = true;
 }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpar erros quando usuário digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (apiError) {
      setApiError('')
    }
  }

  const handleCheckboxChange = (e) => {
      const { value, checked } = e.target;

      setFormData(prevFormData => {
	    if (checked) {
		return {
		    ...prevFormData,
		    tipo_abrigo: [...prevFormData.tipo_abrigo, value]
		};
	    }
	  else {
	      return {
		  ...prevFormData,
		  tipo_abrigo: prevFormData.tipo_abrigo.filter(item => item !== value)
	      };
	  }
	});
  };

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do abrigo é obrigatório'
    }

    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório'
    }

    if (!formData.tipo_abrigo) {
      newErrors.tipo_abrigo = 'Tipo de abrigo é obrigatório'
    }

    if (!formData.vagas_disponiveis) {
      newErrors.vagas_disponiveis = 'Número de vagas é obrigatório'
    } else if (parseInt(formData.vagas_disponiveis) < 0) {
      newErrors.vagas_disponiveis = 'Número de vagas deve ser maior ou igual a zero'
    }

    // Validar URL se fornecida
    if (formData.formulario_inscricao_url) {
      try {
        new URL(formData.formulario_inscricao_url)
      } catch {
        newErrors.formulario_inscricao_url = 'URL inválida'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('=== SHELTER CREATION ===')
    console.log('Form data:', formData)

    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    setLoading(true)
    setApiError('')

    try {
      const requestData = {
        nome: formData.nome.trim(),
        endereco: formData.endereco.trim(),
        tipo_abrigo: formData.tipo_abrigo,
        vagas_disponiveis: parseInt(formData.vagas_disponiveis),
        formulario_inscricao_url: formData.formulario_inscricao_url.trim() || null
      }

      console.log('Sending request to backend:', requestData)

      const response = await fetch('http://localhost:5000/api/abrigos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
      })

      console.log('Response status:', response.status)

      const responseText = await response.text()
      console.log('Raw response:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        throw new Error('Resposta inválida do servidor')
      }

      console.log('Parsed response:', data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao cadastrar abrigo')
      }

      console.log('Shelter created successfully:', data.abrigo)
      alert(`Abrigo "${data.abrigo.nome}" cadastrado com sucesso!`)

      // Redirecionar para página inicial
      router.push('/')

    } catch (error) {
      console.error('Shelter creation error:', error)
      setApiError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Adicionar Abrigo - Baita Ajuda</title>
        <meta name="description" content="Cadastre um novo abrigo" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>
            <Link href="/">Baita Ajuda</Link>
          </h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <div className={styles.formContent}>
            <h2>Adicionar Novo Abrigo</h2>
            <p className={styles.subtitle}>
              Cadastre um abrigo para ajudar pessoas em situação de emergência
            </p>

            {/* Erro da API */}
            {apiError && (
              <div className={styles.errorBanner}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome do Abrigo *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={errors.nome ? styles.inputError : ''}
                  placeholder="Nome do abrigo"
                  required
                />
                {errors.nome && <span className={styles.errorMsg}>{errors.nome}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="endereco">Endereço Completo *</label>
                <textarea
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className={errors.endereco ? styles.inputError : ''}
                  rows="3"
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                  required
                />
                {errors.endereco && <span className={styles.errorMsg}>{errors.endereco}</span>}
              </div>

	      <div className={styles.formGroup}>
		<label>Tipo de Abrigo *</label>

		{opcoesDeAbrigo.map((opcao) => (
		<label key={opcao.value} className={styles.checkboxLabel}>
		  <input
		    type="checkbox"
		    name="tipo_abrigo"
		    id="tipo_abrigo"
		    value={opcao.value}
		    checked={formData.tipo_abrigo.includes(opcao.value)}
		    onChange={handleCheckboxChange}
		    />
		  {/* CORREÇÃO: Apenas o texto, sem a tag <label> envolvendo */}
		    {opcao.label}
		  </label>
		  ))}

		  {errors.tipo_abrigo && <span className={styles.errorMsg}>{errors.tipo_abrigo}</span>}
	      </div>

	      <div className={styles.formGroup}>
                <label htmlFor="vagas_disponiveis">Vagas Disponíveis *</label>
                <input
                  type="number"
                  id="vagas_disponiveis"
                  name="vagas_disponiveis"
                  value={formData.vagas_disponiveis}
                  onChange={handleChange}
                  className={errors.vagas_disponiveis ? styles.inputError : ''}
                  min="0"
                  placeholder="0"
                  required
                  />
                {errors.vagas_disponiveis && <span className={styles.errorMsg}>{errors.vagas_disponiveis}</span>}
	      </div>

              <div className={styles.formGroup}>
                <label htmlFor="formulario_inscricao_url">
                  URL do Formulário de Inscrição (opcional)
                </label>
                <input
                  type="url"
                  id="formulario_inscricao_url"
                  name="formulario_inscricao_url"
                  value={formData.formulario_inscricao_url}
                  onChange={handleChange}
                  className={errors.formulario_inscricao_url ? styles.inputError : ''}
                  placeholder="https://formulario.exemplo.com"
                />
                {errors.formulario_inscricao_url && <span className={styles.errorMsg}>{errors.formulario_inscricao_url}</span>}
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar Abrigo'
                  )}
                </button>
                <Link
                  href="/"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
