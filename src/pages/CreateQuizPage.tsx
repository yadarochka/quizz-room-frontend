import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	createQuiz,
	createSession,
	generateQuestions,
	type GeneratedQuestion,
} from '../services/quizzes';
import type { Question } from '../types/quiz';

type EditableQuestion = Question;

const DEFAULT_TIME_LIMIT = 30;
const MIN_TIME_LIMIT = 5;
const MAX_TIME_LIMIT = 600;

function buildInitialQuestion(): EditableQuestion {
	return {
		id: Date.now(),
		text: '',
		timeLimit: DEFAULT_TIME_LIMIT,
		options: [
			{ id: Date.now() + 1, text: '', isCorrect: false },
			{ id: Date.now() + 2, text: '', isCorrect: false },
		],
	};
}

export function CreateQuizPage() {
	const navigate = useNavigate();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [questions, setQuestions] = useState<EditableQuestion[]>([
		buildInitialQuestion(),
	]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [aiTopic, setAiTopic] = useState('');

	const handleChangeQuestion = (id: number, value: string) => {
		setQuestions((prev) =>
			prev.map((q) => (q.id === id ? { ...q, text: value } : q)),
		);
	};

	const handleChangeTimeLimit = (id: number, value: number) => {
		setQuestions((prev) =>
			prev.map((q) =>
				q.id === id ? { ...q, timeLimit: Math.max(MIN_TIME_LIMIT, value) } : q,
			),
		);
	};

	const handleAddQuestion = () => {
		setQuestions((prev) => [...prev, buildInitialQuestion()]);
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

	const handleCreateQuiz = async (event: FormEvent) => {
		event.preventDefault();
		setError(null);

		const filledQuestions = questions.filter(
			(question) => question.text.trim().length > 0,
		);

		const isEveryQuestionValid = filledQuestions.every((question) => {
			const filledOptions = question.options.filter(
				(option) => option.text.trim().length > 0,
			);

			const hasCorrect = filledOptions.some((option) => option.isCorrect);

			return filledOptions.length >= 2 && hasCorrect;
		});

		if (
			!title.trim() ||
			filledQuestions.length === 0 ||
			!isEveryQuestionValid
		) {
			setError(
				'Введите название, хотя бы один вопрос и минимум два варианта ответа с отмеченным правильным.',
			);
			return;
		}

		const payload = {
			title: title.trim(),
			description: description.trim(),
			questions: filledQuestions.map((question) => {
				const filledOptions = question.options.filter(
					(option) => option.text.trim().length > 0,
				);

				const timeLimit = Math.min(
					MAX_TIME_LIMIT,
					Math.max(MIN_TIME_LIMIT, question.timeLimit),
				);

				return {
					text: question.text.trim(),
					time_limit: timeLimit,
					answers: filledOptions.map((option) => ({
						text: option.text.trim(),
						is_correct: option.isCorrect,
					})),
				};
			}),
		};

		setIsSubmitting(true);

		try {
			const quiz = await createQuiz(payload);

			await createSession(quiz.id);

			// Редиректим на страницу комнаты
			navigate(`/quizzes/${quiz.id}`, { replace: true });
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: 'Не удалось создать квиз. Попробуйте ещё раз.';
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="create-main">
			<section className="create-section">
				<div className="create-header">
					<h1 className="create-title">Создание квиза</h1>
					<p className="create-subtitle">
						Сохраните квиз и сразу получите комнату для участников.
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
							onChange={(event) => setTitle(event.target.value)}
						/>
					</label>

					<label className="field">
						<span className="field__label">Описание (необязательно)</span>
						<textarea
							className="field__textarea"
							placeholder="Короткое описание для участников"
							value={description}
							onChange={(event) =>
								setDescription(event.target.value)
							}
						/>
					</label>

					{/* AI Generation Section */}
					<div style={{
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						padding: '1.5rem',
						borderRadius: '12px',
						marginBottom: '2rem',
						color: 'white',
					}}>
						<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
							🤖 Генерация вопросов с помощью ИИ
						</h3>
						<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
							<label className="field" style={{ flex: 1, margin: 0 }}>
								<span className="field__label" style={{ color: 'white' }}>
									Тема квиза
								</span>
								<input
									type="text"
									className="field__input"
									placeholder="Например: История России, Математика, Фильмы 90-х"
									value={aiTopic}
									onChange={(event) => setAiTopic(event.target.value)}
									disabled={isGenerating}
									style={{ background: 'white' }}
								/>
							</label>
							<button
								type="button"
								className="primary-button"
								onClick={handleGenerateQuestions}
								disabled={isGenerating || !aiTopic.trim()}
								style={{
									background: isGenerating || !aiTopic.trim() ? '#999' : 'white',
									color: isGenerating || !aiTopic.trim() ? '#ccc' : '#667eea',
									border: 'none',
									padding: '0.75rem 1.5rem',
									borderRadius: '8px',
									cursor: isGenerating || !aiTopic.trim() ? 'not-allowed' : 'pointer',
									fontWeight: 'bold',
									whiteSpace: 'nowrap',
								}}
							>
								{isGenerating ? '⏳ Генерируем...' : '✨ Сгенерировать вопросы'}
							</button>
						</div>
						<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
							ИИ создаст 5 вопросов с вариантами ответов по указанной теме
						</p>
					</div>

					<div className="questions-block">
						<div className="questions-block__header">
							<span className="field__label">Вопросы квиза</span>
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

									<label className="field">
										<span className="field__label">
											Время на ответ (сек)
										</span>
										<input
											type="number"
											min={MIN_TIME_LIMIT}
											className="field__input"
											value={question.timeLimit}
											onChange={(event) =>
												handleChangeTimeLimit(
													question.id,
													Number(event.target.value),
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

					{error ? (
						<p className="error-text">{error}</p>
					) : null}

					<div className="create-actions">
						<button
							type="submit"
							className="primary-button"
							disabled={isSubmitting}
						>
							{isSubmitting
								? 'Сохраняем...'
								: 'Создать квиз и комнату'}
						</button>
					</div>
				</form>
			</section>
		</main>
	);
}


