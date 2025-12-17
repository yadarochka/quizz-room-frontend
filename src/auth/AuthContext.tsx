import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	type AuthResponse,
	type AuthUser,
	LOCAL_STORAGE_TOKEN_KEY,
} from '../services/auth';

type AuthContextValue = {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	loading: boolean;
	setAuth: (data: AuthResponse) => void;
	logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
	children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const savedToken =
			localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY) ?? null;

		if (savedToken) {
			setToken(savedToken);
		}

		setLoading(false);
	}, []);

	const setAuth = (data: AuthResponse) => {
		setUser(data.user);
		setToken(data.token);
		localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isAuthenticated: Boolean(token),
				loading,
				setAuth,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
}




