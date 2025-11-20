import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/Header.module.css'

export default function Header() {
  const router = useRouter()

  const getLinkClass = (path) => 
    `${styles.navLink} ${router.pathname === path ? styles.active : ''}`

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href="/" className={styles.logo}>
          <h1>Baita Ajuda</h1>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={getLinkClass('/')}>
            Início
          </Link>
          <Link href="/login" className={getLinkClass('/login')}>
            Entrar
          </Link>
          <Link href="/register" className={getLinkClass('/register')}>
            Registrar
          </Link>
          <Link 
            href="/add-shelter" 
            className={`${getLinkClass('/add-shelter')} ${styles.navLinkPrimary}`}
          >
            Adicionar Abrigo
          </Link>
          <Link href="/manage-shelters" className={getLinkClass('/manage-shelters')}>
            Gerenciar Abrigos
          </Link>
        </nav>
      </div>
    </header>
  )
}