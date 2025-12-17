import {
	type Dispatch,
	type FormEvent,
	type SetStateAction,
	useEffect,
	useState,
} from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { exchangeYandexCode, getAuthRedirectUrl } from './services/auth';
import { useAuth } from './auth/AuthContext';

type AnswerOption = {
	id: number;
	text: string;
	isCorrect: boolean;
};

type Question = {
	id: number;
	text: string;
	options: AnswerOption[];
};

function App() {
	const [isNavOpen, setIsNavOpen] = useState(false);
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="page">
				<p>Загрузка...</p>
			</div>
		);
	}

	return (
		<div className="page">
			<Header isNavOpen={isNavOpen} setIsNavOpen={setIsNavOpen} />

			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route
					path="/login"
					element={<LoginPage />}
				/>
				<Route
					path="/auth/callback"
					element={<AuthCallbackPage />}
				/>
				<Route
					path="/home"
					element={
						isAuthenticated ? (
							<HomePage />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route
					path="/quizzes/create"
					element={
						isAuthenticated ? (
							<CreateQuizPageWrapper />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
				<Route path="*" element={<NotFoundPage />} />
			</Routes>

		</div>
	);
}

function LandingPage() {
	const navigate = useNavigate();

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
							onClick={() => navigate('/login')}
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

type LoginPageProps = {
};

function LoginPage(_: LoginPageProps) {
	const { isAuthenticated } = useAuth();

	if (isAuthenticated) {
		return <Navigate to="/home" replace />;
	}

	const handleYandexLogin = () => {
		const url = getAuthRedirectUrl();
		window.location.href = url;
	};

	return (
		<main className="auth-main">
			<section className="auth-card">
				<h1 className="auth-title">Войти в QuizzRoom</h1>
				<p className="auth-subtitle">
					Авторизуйтесь через Яндекс, чтобы управлять своими квизами.
				</p>
				<button
					type="button"
					className="primary-button auth-button"
					onClick={handleYandexLogin}
				>
					Войти через Яндекс
				</button>
			</section>
		</main>
	);
}

function HomePage() {
	return (
		<main className="section">
			<h1 className="section__title">Мои квизы</h1>
			<p className="section__subtitle">
				Здесь будет список ваших квизов и быстрые действия.
			</p>
		</main>
	);
}

function AuthCallbackPage() {
	const navigate = useNavigate();
	const { setAuth } = useAuth();

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const token = searchParams.get('token');
		const code = searchParams.get('code');

		const handleAuth = async () => {
			try {
				if (token) {
					setAuth({
						token,
						user: {
							id: 'self',
							email: '',
							name: 'Пользователь',
						},
					});
					navigate('/home', { replace: true });
					return;
				}

				if (code) {
					const data = await exchangeYandexCode(code);
					setAuth(data);
					navigate('/home', { replace: true });
					return;
				}

				navigate('/login', { replace: true });
			} catch {
				navigate('/login', { replace: true });
			}
		};

		void handleAuth();
	}, [navigate, setAuth]);

	return (
		<main className="section section--center">
			<p className="section__subtitle">
				Завершаем авторизацию через Яндекс...
			</p>
		</main>
	);
}

function NotFoundPage() {
	const navigate = useNavigate();

	return (
		<main className="section section--center">
			<h1 className="section__title">Страница не найдена</h1>
			<p className="section__subtitle">
				Возможно, ссылка устарела или была введена с ошибкой.
			</p>
			<button
				type="button"
				className="primary-button"
				onClick={() => navigate('/')}
			>
				На главную
			</button>
		</main>
	);
}

type HeaderProps = {
	isNavOpen: boolean;
	setIsNavOpen: Dispatch<SetStateAction<boolean>>;
	onLogoClick?: () => void;
};

function Header({ isNavOpen, setIsNavOpen, onLogoClick }: HeaderProps) {
	const logoClassName = [
		'header__logo',
		onLogoClick ? 'header__logo--clickable' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<header className="header">
			<div
				className={logoClassName}
				onClick={onLogoClick}
				role={onLogoClick ? 'button' : undefined}
			>
				QuizzRoom
			</div>
			<nav
				className={`header__nav ${
					isNavOpen ? 'header__nav--open' : ''
				}`}
			>
				<a href="#about">О компании</a>
				<a href="#news">Новости</a>
				<a href="#help">Помощь</a>
				<a href="#contacts">Контакты</a>
			</nav>
			<button
				type="button"
				className="burger"
				onClick={() => setIsNavOpen((prev) => !prev)}
				aria-label="Открыть меню"
				aria-expanded={isNavOpen}
			>
				<span className="burger__icon">
					<span className="burger__question">?</span>
				</span>
			</button>
		</header>
	);
}

type CreateQuizPageProps = {
	onBack: () => void;
};

function CreateQuizPage({ onBack }: CreateQuizPageProps) {
	const [title, setTitle] = useState('');
	const [questions, setQuestions] = useState<Question[]>([
		{
			id: 1,
			text: '',
			options: [
				{ id: 1, text: '', isCorrect: false },
				{ id: 2, text: '', isCorrect: false },
			],
		},
	]);

	const handleChangeQuestion = (id: number, value: string) => {
		setQuestions((prev) =>
			prev.map((q) => (q.id === id ? { ...q, text: value } : q)),
		);
	};

	const handleAddQuestion = () => {
		setQuestions((prev) => [
			...prev,
			{
				id: Date.now(),
				text: '',
				options: [
					{ id: Date.now() + 1, text: '', isCorrect: false },
					{ id: Date.now() + 2, text: '', isCorrect: false },
				],
			},
		]);
	};

	const handleChangeOptionText = (
		questionId: number,
		optionId: number,
		value: string,
	) => {
		setQuestions((prev) =>
			prev.map((question) =>
				question.id !== questionId
					? question
					: {
							...question,
							options: question.options.map((option) =>
								option.id === optionId
									? { ...option, text: value }
									: option,
							),
					  },
			),
		);
	};

	const handleToggleCorrectOption = (questionId: number, optionId: number) => {
		setQuestions((prev) =>
			prev.map((question) =>
				question.id !== questionId
					? question
					: {
							...question,
							options: question.options.map((option) =>
								option.id === optionId
									? {
											...option,
											isCorrect: !option.isCorrect,
									  }
									: option,
							),
					  },
			),
		);
	};

	const handleAddOption = (questionId: number) => {
		setQuestions((prev) =>
			prev.map((question) =>
				question.id !== questionId
					? question
					: {
							...question,
							options: [
								...question.options,
								{
									id: Date.now(),
									text: '',
									isCorrect: false,
								},
							],
					  },
			),
		);
	};

	const handleCreateQuiz = (event: FormEvent) => {
		event.preventDefault();

		const filledQuestions = questions.filter(
			(question) => question.text.trim().length > 0,
		);

		const isEveryQuestionValid = filledQuestions.every((question) => {
			const filledOptions = question.options.filter(
				(option) => option.text.trim().length > 0,
			);

			const hasCorrect = filledOptions.some(
				(option) => option.isCorrect,
			);

			return filledOptions.length >= 2 && hasCorrect;
		});

		if (
			!title.trim() ||
			filledQuestions.length === 0 ||
			!isEveryQuestionValid
		) {
			// eslint-disable-next-line no-alert
			alert(
				'Введите название, хотя бы один вопрос и минимум два варианта ответа с отмеченным правильным.',
			);
			return;
		}

		// Здесь вы можете отправить данные на сервер или сохранить их локально
		// eslint-disable-next-line no-console
		console.log('Создан квиз:', {
			title,
			questions: filledQuestions.map((question) => ({
				...question,
				options: question.options.filter(
					(option) => option.text.trim().length > 0,
				),
			})),
		});

		// eslint-disable-next-line no-alert
		alert('Квиз успешно создан!');
		onBack();
	};

	return (
		<section className="create-section">
			<div className="create-header">
				<h1 className="create-title">Создание квиза</h1>
				<p className="create-subtitle">
					Укажите название квиза и добавьте вопросы для участников.
				</p>
			</div>

			<form className="create-form" onSubmit={handleCreateQuiz}>
				<label className="field">
					<span className="field__label">Название квиза</span>
					<input
						type="text"
						className="field__input"
						placeholder="Например: Викторина по фильмам"
						value={title}
						onChange={(event) =>
							setTitle(event.target.value)
						}
					/>
				</label>

				<div className="questions-block">
					<div className="questions-block__header">
						<span className="field__label">
							Вопросы квиза
						</span>
						<button
							type="button"
							className="link-button"
							onClick={handleAddQuestion}
						>
							+ Добавить вопрос
						</button>
					</div>

					<div className="questions-list">
						{questions.map((question, index) => (
							<div key={question.id} className="question-block">
								<label className="field field--question">
									<span className="field__label">
										Вопрос {index + 1}
									</span>
									<textarea
										className="field__textarea"
										placeholder="Введите текст вопроса"
										value={question.text}
										onChange={(event) =>
											handleChangeQuestion(
												question.id,
												event.target.value,
											)
										}
									/>
								</label>

								<div className="options-block">
									<div className="options-block__header">
										<span className="field__label">
											Варианты ответа
										</span>
										<button
											type="button"
											className="link-button"
											onClick={() =>
												handleAddOption(question.id)
											}
										>
											+ Добавить вариант
										</button>
									</div>

									<div className="options-list">
										{question.options.map(
											(option, idx) => (
												<div
													key={option.id}
													className="option-row"
												>
													<label className="option-checkbox">
														<input
															type="checkbox"
															checked={
																option.isCorrect
															}
															onChange={() =>
																handleToggleCorrectOption(
																	question.id,
																	option.id,
																)
															}
														/>
														<span>
															Правильный ответ
														</span>
													</label>
													<input
														type="text"
														className="field__input option-input"
														placeholder={`Вариант ${
															idx + 1
														}`}
														value={option.text}
														onChange={(event) =>
															handleChangeOptionText(
																question.id,
																option.id,
																event.target
																	.value,
															)
														}
													/>
												</div>
											),
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="create-actions">
					<button
						type="button"
						className="secondary-button"
						onClick={onBack}
					>
						Назад
					</button>
					<button type="submit" className="primary-button">
						Создать
					</button>
				</div>
			</form>
		</section>
	);
}

function CreateQuizPageWrapper() {
	const navigate = useNavigate();

	return <CreateQuizPage onBack={() => navigate(-1)} />;
}

export default App;
