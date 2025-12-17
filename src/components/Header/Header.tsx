import { type Dispatch, type SetStateAction } from 'react';
import './Header.css';

type HeaderProps = {
	isNavOpen: boolean;
	setIsNavOpen: Dispatch<SetStateAction<boolean>>;
	onLogoClick?: () => void;
};

export function Header({ isNavOpen, setIsNavOpen, onLogoClick }: HeaderProps) {
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

