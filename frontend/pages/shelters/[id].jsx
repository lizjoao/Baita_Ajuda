import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '../../components/Header';
import styles from '../../styles/ShelterDetailsUser.module.css';

/* ==========================================================================
   DYNAMIC IMPORTS
   ========================================================================== */
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => <div className={styles.loadingMap}>Carregando mapa...</div>
});

/* ==========================================================================
   HELPER COMPONENTS
   ========================================================================== */

const StarRating = ({ rating, onRatingChange, className }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className={className}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => onRatingChange(ratingValue)}
              style={{ display: 'none' }}
            />
            <span
              className={styles.star}
              style={{
                color: ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"
              }}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
            >
              &#9733;
            </span>
          </label>
        );
      })}
    </div>
  );
};

function ReviewDistribution({ totalReviews, distribution, averageRating }) {
  const displayDistribution = totalReviews > 0 ? distribution : [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];

  return (
    <div className={styles.reviewDistribution}>
      <h3>{averageRating} de 5 ⭐</h3>
      <p className={styles.totalReviewsText}>
        {totalReviews} avaliações globais
      </p>

      <div className={styles.barsContainer}>
        {displayDistribution.map(({ stars, count, percentage }) => (
          <div key={stars} className={styles.barRow}>
            <span className={styles.starLabel}>{stars} estrelas</span>
            <div className={styles.barWrapper}>
              <div className={styles.progressBar} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className={styles.percentageLabel}>{percentage}%</span>
          </div>
        ))}
      </div>

      {totalReviews === 0 && (
        <p className={styles.noReviewsMessage}>Seja o primeiro a avaliar este abrigo!</p>
      )}
    </div>
  );
}

/* ==========================================================================
   UTILITY FUNCTIONS
   ========================================================================== */

const calculateReviewDistribution = (reviews) => {
  const totalReviews = reviews.length;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach(review => {
    const rating = Math.round(review.nota);
    if (rating >= 1 && rating <= 5) {
      counts[rating]++;
    }
  });

  return [5, 4, 3, 2, 1].map(stars => {
    const count = counts[stars];
    const percentage = totalReviews > 0
      ? Math.round((count / totalReviews) * 100)
      : 0;

    return { stars, count, percentage };
  });
};

const calculateMeanRating = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return '0.0';
  }
  const sum = reviews.reduce((acc, review) => acc + review.nota, 0);
  return (sum / reviews.length).toFixed(1);
};

/* ==========================================================================
   MAIN PAGE COMPONENT
   ========================================================================== */

export default function ShelterDetail() {
  const router = useRouter();
  const { id } = router.query;

  // --- State ---
  const [shelter, setShelter] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [donationsList, setDonationsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewData, setReviewData] = useState({ nota: 5, comentario: '', anonimo: false });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donations, setDonations] = useState({});
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // --- Effects ---
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [shelterRes, needsRes, reviewsRes, donationsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/abrigos/${id}`),
          fetch(`http://localhost:5000/api/abrigos/${id}/necessidades`),
          fetch(`http://localhost:5000/api/abrigos/${id}/avaliacoes`),
          fetch(`http://localhost:5000/api/abrigos/${id}/doacoes`)
        ]);

        if (!shelterRes.ok) throw new Error('Abrigo não encontrado');

        const shelterData = await shelterRes.json();
        const needsData = await needsRes.json();
        const reviewsData = await reviewsRes.json();
        const donationsData = await donationsRes.json();

        setShelter(shelterData.abrigo);
        setNeeds(needsData.necessidades);
        setReviews(reviewsData.avaliacoes);
        setDonationsList(donationsData.doacoes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // --- Handlers ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      const payload = { ...reviewData };

      const response = await fetch(`http://localhost:5000/api/abrigos/${id}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao enviar avaliação.');

      const updatedReviewsRes = await fetch(`http://localhost:5000/api/abrigos/${id}/avaliacoes`);
      const updatedReviewsData = await updatedReviewsRes.json();
      setReviews(updatedReviewsData.avaliacoes);

      setReviewData({ nota: 5, comentario: '', anonimo: false });
      setReviewSuccess(true);
    } catch (err) {
      console.error("Review submission error:", err);
      setReviewError(err.message || 'Erro desconhecido ao avaliar.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDonationChange = (needId, quantity) => {
    const numQuantity = Number(quantity);
    setDonations(prev => {
      const newDonations = { ...prev };
      if (numQuantity > 0) {
        newDonations[needId] = numQuantity;
      } else {
        delete newDonations[needId];
      }
      return newDonations;
    });
  };

  const handleConfirmDonation = async (e) => {
    e.preventDefault();
    const donationItems = Object.keys(donations).map(needId => ({
      necessidade_id: Number(needId),
      quantidade: donations[needId],
    }));

    if (donationItems.length === 0) {
      setSubmitError('Por favor, especifique a quantidade de pelo menos um item.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/abrigos/${id}/doacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doador_nome: donorName,
          doador_contato: donorContact,
          doacoes: donationItems,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao registrar doação.');

      alert('Obrigado! Sua doação foi registrada com sucesso.');
      setIsModalOpen(false);
      setDonations({});
      setDonorName('');
      setDonorContact('');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => '⭐'.repeat(rating);

  // --- Render ---
  if (loading) return <div className={styles.centerStatus}>Carregando...</div>;
  if (error) return <div className={styles.centerStatus}>Erro: {error}</div>;
  if (!shelter) return <div className={styles.centerStatus}>Abrigo não encontrado.</div>;

  const meanRating = calculateMeanRating(reviews);

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>

        {/* --- Informações do Abrigo Card --- */}
        <div className={`${styles.card} ${styles.infoCard}`}>
          <div className={styles.headerRow}>
            <h1>{shelter.nome}</h1>
            <span className={shelter.ativo ? styles.badgeActive : styles.badgeInactive}>
              {shelter.ativo ? 'Em Funcionamento' : 'Inativo'}
            </span>
          </div>

          <div className={styles.cardContent}>
            {/* LEFT COLUMN: Text Info */}
            <div className={styles.infoGrid}>

              {/* Location Text */}
              <div className={styles.infoBlock}>
                <h3>📍 Localização</h3>
                <p>{shelter.endereco}</p>
                <p className={styles.textMuted}>{shelter.cidade} - {shelter.estado}</p>
              </div>

              {/* Contact */}
              <div className={styles.infoBlock}>
                <h3>📞 Contato</h3>
                {shelter.contato_responsavel && (
                  <p style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666', display: 'block' }}>Responsável</span>
                    {shelter.contato_responsavel}
                  </p>
                )}
                {shelter.telefone && (
                  <p className={styles.iconText}>📞 {shelter.telefone}</p>
                )}
                {shelter.email && (
                  <p className={styles.iconText}>✉️ {shelter.email}</p>
                )}
                {!shelter.telefone && !shelter.email && <p className={styles.textMuted}>Sem contato cadastrado</p>}
              </div>

              {/* Operation & Capacity */}
              <div className={styles.infoBlock}>
                <h3>⏰ Funcionamento & Vagas</h3>
                <p className={styles.iconText}>
                  <span>{shelter.horario_funcionamento || 'Horário não informado'}</span>
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666', display: 'block', marginBottom: '4px' }}>Capacidade</span>
                  <span className={shelter.vagas_disponiveis > 0 ? styles.availableStatus : styles.fullStatus} style={{ fontSize: '1.2rem' }}>
                    {shelter.vagas_disponiveis} vagas livres
                  </span>
                  <span className={styles.textMuted}> / {shelter.capacidade_total} total</span>
                </div>
              </div>

              {/* Rating Summary */}
              <div className={styles.infoBlock}>
                <h3>Avaliação</h3>
                <p>
                  {meanRating} ⭐
                  <span className={styles.reviewCount}>
                    ({reviews.length} avaliações)
                  </span>
                </p>
              </div>

              {/* Accept Tags */}
              <div className={styles.infoBlock} style={{ gridColumn: '1 / -1' }}>
                <h3>Aceita</h3>
                <div className={styles.tags}>

                  {shelter.aceita_pets && (
                     <span className={styles.tagPets} style={{opacity: 0.7}}>🐾 Pets</span>
                  )}

                  {shelter.tipo_feminino && (
                    <span className={styles.tagFeminino}>Mulheres</span>
                  )}
                  {shelter.tipo_masculino && (
                    <span className={styles.tagMasculino}>Homens</span>
                  )}

                  {!shelter.aceita_pets && !shelter.tipo_feminino && !shelter.tipo_masculino && (
                    <span className={styles.tagGeneral}>Público Geral</span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Map */}
            <div className={styles.mapColumn}>
              <div className={styles.mapLabel}>Localização no mapa</div>
              <div className={styles.mapContainer}>
                {(shelter.latitude || shelter.lat) && (shelter.longitude || shelter.lng) ? (
                  <Map shelters={[shelter]} />
                ) : (
                  <p className={styles.noMapData}>Localização indisponível.</p>
                )}
              </div>
            </div>
          </div>

          {/* Description & Restrictions */}
          {(shelter.descricao || shelter.restricoes) && (
            <div className={styles.detailsSection}>
              {shelter.descricao && (
                <div className={styles.detailBlock}>
                  <h3>Sobre o Abrigo</h3>
                  <p>{shelter.descricao}</p>
                </div>
              )}
              {shelter.restricoes && (
                <div className={styles.detailBlock}>
                  <h3>⚠️ Restrições e Regras</h3>
                  <div className={styles.alertBox}>
                    <p>{shelter.restricoes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Needs Card --- */}
        <div className={styles.card}>
          <h2>Necessidades do Abrigo</h2>
          <button onClick={() => setIsModalOpen(true)} className={styles.donateButton}>
            Doar Itens
          </button>

          {needs.length > 0 ? (
            <ul className={styles.needsList}>
              {needs.map(need => (
                <li key={need.id} className={styles.needsItem}>
                    <p>{need.item}</p>
		    <span className={`${styles.levelBadge} ${styles['level-' + need.nivel]}`}>
			{need.nivel.replace('_', ' ')}
		    </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No momento, não há necessidades específicas cadastradas.</p>
          )}
        </div>

        {/* --- Reviews Section --- */}
        <div className={styles.card}>
          <h2>Avaliações</h2>
          <ReviewDistribution
            totalReviews={reviews.length}
            distribution={calculateReviewDistribution(reviews)}
            averageRating={meanRating}
          />
          <div className={styles.reviewsList}>
            {reviews.map(review => (
              <div key={review.id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewRating}>{renderStars(review.nota)}</span>
                  <span className={styles.reviewDate}>
                    {new Date(review.data_avaliacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className={styles.reviewComment}>{review.comentario}</p>
              </div>
            ))}
          </div>

          <div className={styles.reviewFormSection}>
            <h3>Deixe sua Avaliação</h3>
            {reviewError && <p className={styles.errorMsg}>{reviewError}</p>}
            {reviewSuccess && <p className={styles.successMsg}>Avaliação enviada com sucesso! Obrigado!</p>}

            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
              <div className={styles.formGroup}>
                <StarRating
                  rating={reviewData.nota}
                  onRatingChange={(newRating) => setReviewData({ ...reviewData, nota: newRating })}
                  className={styles.starRatingContainer}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Comentário (Opcional):</label>
                <textarea
                  rows="3"
                  value={reviewData.comentario}
                  onChange={(e) => setReviewData({ ...reviewData, comentario: e.target.value })}
                  placeholder="Conte sua experiência..."
                  className={styles.commentTextarea}
                />
              </div>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="anonimo"
                  checked={reviewData.anonimo}
                  onChange={(e) => setReviewData({ ...reviewData, anonimo: e.target.checked })}
                />
                <label htmlFor="anonimo">Avaliar anonimamente</label>
              </div>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </form>
          </div>
        </div>

        {/* --- Donations History --- */}
        <div className={styles.card}>
          <h2>Doações Recebidas</h2>
          {donationsList.length > 0 ? (
            <ul className={styles.donationsList}>
              {donationsList.map(donation => (
                <li key={donation.id} className={styles.donationListItem}>
                  <div className={styles.donationInfo}>
                    <span className={styles.donorName}>{donation.doador_nome}</span>
                    <span> doou </span>
                    <span className={styles.donationQuantity}>
                      {donation.quantidade_doada}x {donation.item_nome}
                    </span>
                  </div>
                  <span className={styles.donationDate}>
                    {new Date(donation.data_doacao).toLocaleDateString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Este abrigo ainda não registrou doações. Seja o primeiro!</p>
          )}
        </div>

        {/* --- Donation Modal --- */}
        {isModalOpen && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <h2>Registrar Doação de Itens</h2>
              <p>Preencha seu nome, contato e a quantidade dos itens que você deseja doar.</p>

              <form onSubmit={handleConfirmDonation} className={styles.donationForm}>
                <input
                  type="text"
                  placeholder="Seu nome completo *"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Seu e-mail ou telefone (opcional)"
                  value={donorContact}
                  onChange={(e) => setDonorContact(e.target.value)}
                />

                <div className={styles.donationItemsList}>
                  {needs.map(need => (
                    <div key={need.id} className={styles.donationItem}>
                      <label>{need.item} ({need.quantidade})</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qtd."
                        onChange={(e) => handleDonationChange(need.id, e.target.value)}
                        className={styles.quantityInput}
                      />
                    </div>
                  ))}
                </div>

                {submitError && <p className={styles.errorMsg}>{submitError}</p>}

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnSecondary}>
                    Cancelar
                  </button>
                  <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                    {submitting ? 'Registrando...' : 'Confirmar Doação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
