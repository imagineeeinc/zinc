import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { Server } from 'socket.io'
import { socketManger } from './server/socket';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer, {
			maxHttpBufferSize: 1e9
		})
		socketManger(io)
	}
}

export default defineConfig({
	plugins: [sveltekit(), webSocketServer],
});
