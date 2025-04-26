import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// This page doesn't need any server data loading
	// All data is fetched client-side from the API
	return {};
};