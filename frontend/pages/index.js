import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Baita Ajuda</title>
        
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Baita Ajuda</h1>
        </div>
      </header>

      <main className={styles.main}>
          
        <div className={styles.buttons}>
          <Link href="/login" className={styles.btn}>
            Entrar
          </Link>
          <Link href="/register" className={styles.btn}>
            Registrar
          </Link>
          <Link href="/add-shelter" className={styles.btn}>
            Adicionar Abrigo
          </Link>
        </div>
      </main>
    </div>
  )
}