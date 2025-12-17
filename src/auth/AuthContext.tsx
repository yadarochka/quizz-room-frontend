import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	type AuthUser,
	fetchCurrentUser,
	logoutRequest,
} from '../services/auth';

type AuthContextValue = {
	user: AuthUser | null;
	isAuthenticated: boolean;
	loading: boolean;
	refreshUser: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
	children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshUser = useCallback(async () => {
		setLoading(true);
		try {
			const me = await fetchCurrentUser();
			setUser(me);
		} catch (error) {
			setUser(null);
			throw error;
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshUser().catch(() => {});
	}, [refreshUser]);

	const logout = useCallback(async () => {
		try {
			await logoutRequest();
		} finally {
			setUser(null);
		}
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: Boolean(user),
				loading,
				refreshUser,
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




