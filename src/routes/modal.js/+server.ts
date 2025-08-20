// Move the file to: src/routes/modal.js/+server.ts

import { NstartModal } from '../../../modal-package/src/modal';
import type { RequestHandler } from '@sveltejs/kit';

// Generate the modal code
const modalCode = `
// Modal implementation
${NstartModal.toString()}

// Expose to window
if (typeof window !== 'undefined') {
  window.NstartModal = NstartModal;
}
`;

export const GET: RequestHandler = async () => {
	return new Response(modalCode, {
		headers: {
			'Content-Type': 'application/javascript',
			'Cache-Control': 'public, max-age=31536000'
		}
	});
};
