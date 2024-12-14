import { createUserLink, getSocketId, removeLink } from './db.js'
export function socketManger(io) {
	io.on('connection', (socket) => {
		socket.on('registerSelf', (data) => {
			createUserLink(data.id, socket.id)
		})
		socket.on('channelTo', async (data) => {
			let socketId = await getSocketId(data.recipient)
			if (!socketId) return
			socket.in(socketId.socket_id).emit('channelFrom', data)
		})
		socket.on('disconnect', () => {
			removeLink(socket.id)
		})
	})
}