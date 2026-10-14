import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

const STORAGE_KEY = "raftlabs-admin-key";

interface AdminKeyContextValue {
	adminKey: string | null;
	signIn: (key: string) => void;
	signOut: () => void;
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

// sessionStorage: the key disappears when the tab closes.
const read = () => {
	try {
		return sessionStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
};

export function AdminKeyProvider({ children }: { children: ReactNode }) {
	const [adminKey, setAdminKey] = useState<string | null>(read);

	const signIn = useCallback((key: string) => {
		try {
			sessionStorage.setItem(STORAGE_KEY, key);
		} catch {
			// storage unavailable: the key lives in memory for this page load only
		}
		setAdminKey(key);
	}, []);

	const signOut = useCallback(() => {
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch {
			// nothing to clean up
		}
		setAdminKey(null);
	}, []);

	const value = useMemo(
		() => ({ adminKey, signIn, signOut }),
		[adminKey, signIn, signOut],
	);
	return (
		<AdminKeyContext.Provider value={value}>{children}</AdminKeyContext.Provider>
	);
}

export function useAdminKey() {
	const context = useContext(AdminKeyContext);
	if (!context)
		throw new Error("useAdminKey must be used inside AdminKeyProvider");
	return context;
}
