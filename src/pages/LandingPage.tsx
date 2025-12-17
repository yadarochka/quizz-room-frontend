import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LandingPage() {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();

	return (
		<main>
			<section className="hero">
				<div className="hero__content">
					<h1 className="hero__title">
						QuizzRoom — это
						<br />
						приложение для квизов
					</h1>
					<p className="hero__subtitle">
						Создавайте и проводите интерактивные квизы легко и
						быстро.
					</p>
					<div className="hero__actions">
						<button
							className="hero__button"
							onClick={() => navigate('/quizzes/create')}
						>
							Создать квиз
						</button>
						<button
							className="secondary-button hero__secondary"
							onClick={() =>
								navigate(isAuthenticated ? '/join' : '/login')
							}
						>
							Присоединиться к квизу
						</button>
					</div>
				</div>
				<div className="hero__illustration">
					<div className="hero__person" />
				</div>
			</section>

			<section className="section section--center">
				<p className="section__eyebrow">Квизы, которые объединяют</p>
				<h2 className="section__title">Преимущества QuizzRoom</h2>
				<p className="section__subtitle">
					Всё, что нужно для идеального квиза
				</p>

				<div className="benefits">
					<div className="benefit-card">
						<div className="benefit-card__icon">
							<span className="icon icon--cart" />
						</div>
						<h3 className="benefit-card__title">Бесплатно</h3>
						<p className="benefit-card__text">
							Создавайте и проводите квизы
							<br />
							совершенно бесплатно.
						</p>
					</div>

					<div className="benefit-card">
						<div className="benefit-card__icon">
							<span className="icon icon--user" />
						</div>
						<h3 className="benefit-card__title">
							Не нужна регистрация
						</h3>
						<p className="benefit-card__text">
							Максимально быстрый старт
							<br />
							без лишних шагов.
						</p>
					</div>

					<div className="benefit-card">
						<div className="benefit-card__icon">
							<span className="icon icon--star" />
						</div>
						<h3 className="benefit-card__title">
							Создание квизов с помощью ИИ
						</h3>
						<p className="benefit-card__text">
							ИИ поможет вам сгенерировать
							<br />
							увлекательные вопросы по вашей теме.
						</p>
					</div>

					<div className="benefit-card">
						<div className="benefit-card__icon">
							<span className="icon icon--device" />
						</div>
						<h3 className="benefit-card__title">
							Поддержка любого устройства
						</h3>
						<p className="benefit-card__text">
							Подключайтесь с ноутбука, планшета
							<br />
							или смартфона.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}


