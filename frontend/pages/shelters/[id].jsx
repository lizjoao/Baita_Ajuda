import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/ShelterDetailsUser.module.css'; // We will create this CSS file

export default function ShelterDetail() {

    const router = useRouter();
    const { id } = router.query;

    const [shelter, setShelter] = useState(null);
    const [needs, setNeeds] = useState([]);
    const [reviews, setReviews] = useState([]); // ✨ Add state for reviews
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [donations, setDonations] = useState({}); // e.g., { need_id_1: 5, need_id_2: 10 }
    const [donorName, setDonorName] = useState('');
    const [donorContact, setDonorContact] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [donationsList, setDonationsList] = useState([]);

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
	    <main className={styles.main}>
		<header className={styles.header}>
		    <Link href="/" className={styles.backLink}>Voltar</Link>
		</header>

		{/* --- Informações do Abrigo Card --- */}
		<div className={`${styles.card} ${styles.infoCard}`}>
		    <h1>{shelter.nome}</h1>
		    <div className={styles.infoGrid}>
			<div className={styles.infoBlock}>
			    <h3>Endereço:</h3>
			    <p>{shelter.endereco}</p>
			</div>
			<div className={styles.infoBlock}>
			    <h3>Avaliação:</h3>
			    <p>{Number(shelter.media_avaliacoes).toFixed(1)} ⭐</p>
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
		    {reviews.length > 0 ? (
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
		    ) : (
			<p>Este abrigo ainda não possui avaliações.</p>
		    )}
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
