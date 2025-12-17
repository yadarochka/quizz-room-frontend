import { type Dispatch, type SetStateAction } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Header.css';

type HeaderProps = {
	isNavOpen: boolean;
	setIsNavOpen: Dispatch<SetStateAction<boolean>>;
};

export function Header({ isNavOpen, setIsNavOpen }: HeaderProps) {
	const navigate = useNavigate();
	const { isAuthenticated, logout } = useAuth();

	const handleLogoClick = () => {
		navigate('/');
		setIsNavOpen(false);
	};

	const handleNavClick = () => {
		setIsNavOpen(false);
	};

	const handleLogout = async () => {
		try {
			await logout();
			navigate('/login');
			setIsNavOpen(false);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Logout error:', error);
		}
	};

	return (
		<header className="header">
			<div
				className="header__logo header__logo--clickable"
				onClick={handleLogoClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleLogoClick();
					}
				}}
			>
				QuizzRoom
			</div>
			<nav
				className={`header__nav ${
					isNavOpen ? 'header__nav--open' : ''
				}`}
			>
				{isAuthenticated ? (
					<>
						<Link to="/quizzes/create" onClick={handleNavClick}>
							Создать квиз
						</Link>
						<Link to="/join" onClick={handleNavClick}>
							Присоединиться к квизу
						</Link>
						<Link to="/home" onClick={handleNavClick}>
							Мои квизы
						</Link>
						<Link to="/completed" onClick={handleNavClick}>
							Проведенные квизы
						</Link>
						<button
							type="button"
							onClick={handleLogout}
							className="header__logout"
							style={{
								background: 'transparent',
								border: 'none',
								color: 'inherit',
								cursor: 'pointer',
								fontSize: 'inherit',
								fontFamily: 'inherit',
								padding: '0.5rem 1rem',
								borderRadius: '8px',
								transition: 'background-color 0.2s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							Выйти
						</button>
					</>
				) : (
					<Link to="/login" onClick={handleNavClick}>
						Войти
					</Link>
				)}
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


