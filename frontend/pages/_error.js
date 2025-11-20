import React from 'react'

function Error({ statusCode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>
        {statusCode
          ? `Erro ${statusCode} no servidor`
          : 'Erro na aplicação'}
      </h1>
      <p>Por favor, recarregue a página ou volte para o início.</p>
      <a href="/" style={{ color: '#667eea', marginTop: '20px' }}>
        Voltar para a página inicial
      </a>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error