import type { PageLoad } from './$types';

export async function load({ params }) {
	const { id } = params;
	return {
		id
	};
}