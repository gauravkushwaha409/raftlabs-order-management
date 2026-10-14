// packages/query/src/persister.ts
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// wrap localStorage to match AsyncStorage interface
const asyncLocalStorage = {
	getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
	setItem: (key: string, value: string) =>
		Promise.resolve(localStorage.setItem(key, value)),
	removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

export const asyncStoragePersister = createAsyncStoragePersister({
	storage: typeof window !== "undefined" ? asyncLocalStorage : null,
	key: "APP_QUERY_CACHE",
	throttleTime: 1000, // save at most once per second
});
