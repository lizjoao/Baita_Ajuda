import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '../../components/Header';
import styles from '../../styles/ShelterDetailsUser.module.css';

const Map = dynamic(() => import('../../components/Map'), {
    ssr: false,
    loading: () => <div className={styles.loadingMap}>Carregando mapa...</div>
});

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
                            {/* The width will be 0% if totalReviews is 0 */}
                            <div className={styles.progressBar} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className={styles.percentageLabel}>{percentage}%</span>
                    </div>
                ))}
            </div>

            {/* Optionally add a message if there are no reviews */}
            {totalReviews === 0 && (
                <p className={styles.noReviewsMessage}>Seja o primeiro a avaliar este abrigo!</p>
            )}

        </div>
    );
}

const calculateReviewDistribution = (reviews) => {
    const totalReviews = reviews.length;

    // Initialize counts for stars 1 through 5
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    // 1. Calculate raw counts
    reviews.forEach(review => {
        const rating = Math.round(review.nota); // Assuming 'nota' is the rating (e.g., 5, 4, 3, etc.)
        if (rating >= 1 && rating <= 5) {
            counts[rating]++;
        }
    });

    // 2. Calculate percentages and format the final array
    const distribution = [5, 4, 3, 2, 1].map(stars => {
        const count = counts[stars];
        // Calculate percentage, handling division by zero if totalReviews is 0
        const percentage = totalReviews > 0
            ? Math.round((count / totalReviews) * 100)
            : 0;

        return {
            stars: stars,
            count: count,
            percentage: percentage,
        };
    });

    return distribution;
};

export default function ShelterDetail() {

    const router = useRouter();
    const { id } = router.query;

    const [shelter, setShelter] = useState(null);
    const [needs, setNeeds] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reviewData, setReviewData] = useState({ nota: 5, comentario: '', anonimo: false });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [donations, setDonations] = useState({}); // e.g., { need_id_1: 5, need_id_2: 10 }
    const [donorName, setDonorName] = useState('');
    const [donorContact, setDonorContact] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [donationsList, setDonationsList] = useState([]);


    const handleSubmitReview = async (e) => {
	e.preventDefault();
	setReviewSubmitting(true);
	setReviewError(null);
	setReviewSuccess(false);

	try {
            const payload = {
		...reviewData,
		// You should add the user's ID here if they are logged in and the review is not anonymous.
		// usuario_id: user?.id,
            };

            const response = await fetch(`http://localhost:5000/api/abrigos/${id}/avaliacoes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
		throw new Error(data.error || 'Falha ao enviar avaliação.');
            }

            // 💡 Success: Update the local reviews list and reset the form
            // Re-fetch reviews to get the updated list and recalculate distribution
            // (You should replace this simplified logic with a dedicated refresh function if you have one)
            const updatedReviewsRes = await fetch(`http://localhost:5000/api/abrigos/${id}/avaliacoes`);
            const updatedReviewsData = await updatedReviewsRes.json();
            setReviews(updatedReviewsData.avaliacoes);

            setReviewData({ nota: 5, comentario: '', anonimo: false }); // Reset form
            setReviewSuccess(true);

	} catch (err) {
            console.error("Review submission error:", err);
            setReviewError(err.message || 'Erro desconhecido ao avaliar.');
	} finally {
            setReviewSubmitting(false);
	}
    };


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


    const renderStars = (rating) => {
	return '⭐'.repeat(rating);
    };

    if (loading) return <div className={styles.centerStatus}>Carregando...</div>;
    if (error) return <div className={styles.centerStatus}>Erro: {error}</div>;
    if (!shelter) return <div className={styles.centerStatus}>Abrigo não encontrado.</div>;


    const handleDonationChange = (needId, quantity) => {
	const numQuantity = Number(quantity);
	setDonations(prev => {
	    const newDonations = { ...prev };
	    if (numQuantity > 0) {
		newDonations[needId] = numQuantity;
	    } else {
		delete newDonations[needId]; // Remove if quantity is 0 or empty
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
	    setIsModalOpen(false); // Close the modal
	    setDonations({});     // Reset the form
	    setDonorName('');
	    setDonorContact('');

	} catch (err) {
	    setSubmitError(err.message);
	} finally {
	    setSubmitting(false);
	}
    };


    return (
	<div className={styles.container}>
			<Header />
	    <main className={styles.main}>

		{/* --- Informações do Abrigo Card --- */}
		<div className={styles.infoMapWrapper}>
		    <div className={`${styles.card} ${styles.infoCard}`}>
			<h1>{shelter.nome}</h1>
			<div className={styles.infoGrid}>
			    <div className={styles.infoBlock}>
				<h3>Endereço:</h3>
				<p>{shelter.endereco}</p>
			    </div>
			    <div className={styles.infoBlock}>
				<h3>Avaliação:</h3>
				<p>
				    {shelter.media_avaliacoes ? Number(shelter.media_avaliacoes).toFixed(1) : '0.0'} ⭐

				    <span className={styles.reviewCount}>
					 ({reviews.length} avaliações)
				    </span>
				</p>
			    </div>
			    <div className={styles.infoBlock}>
				<h3>Aceita:</h3>
				<div className={styles.tags}>
				    {shelter.aceita_pets && <span>Pets</span>}
				    {shelter.tipo_feminino && <span>Feminino</span>}
				    {shelter.tipo_masculino && <span>Masculino</span>}
				</div>
			    </div>
			    <div className={styles.infoBlock}>
				<h3>Vagas:</h3>
				<p>{shelter.vagas_disponiveis}</p>
			    </div>
			</div>
		    </div>
		    <section className={`${styles.card} ${styles.mapCard}`}>
			<h2 className={styles.mapTitle}>Localização no mapa</h2>
			<div className={styles.mapContainer}>
			    {shelter.latitude && shelter.longitude ? (
				<Map shelters={[shelter]} />
			    ) : (
				<p className={styles.noMapData}>Localização do mapa indisponível.</p>
			    )}
			</div>
		    </section>
		</div>

		{/* --- Necessidades do Abrigo Card --- */}
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
				    {need.quantidade && <span>{need.quantidade}</span>}
				</li>
			    ))}
			</ul>
		    ) : (
			<p>No momento, não há necessidades específicas cadastradas.</p>
		    )}
		</div>



		<div className={styles.card}>
		    <h2>Avaliações</h2>

		    <ReviewDistribution
			totalReviews={reviews.length}
			distribution={calculateReviewDistribution(reviews)}
			averageRating={shelter.media_avaliacoes ? Number(shelter.media_avaliacoes).toFixed(1) : '0.0'}
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
				<label>Sua Nota:</label>
				<select
				    value={reviewData.nota}
				    onChange={(e) => setReviewData({ ...reviewData, nota: parseInt(e.target.value) })}
				    className={styles.ratingSelect}
				    required
				>
				    <option value={5}>5 Estrelas - Excelente</option>
				    <option value={4}>4 Estrelas - Muito Bom</option>
				    <option value={3}>3 Estrelas - Bom</option>
				    <option value={2}>2 Estrelas - Regular</option>
				    <option value={1}>1 Estrela - Ruim</option>
				</select>
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

	    </main>
	</div>
    );

}
