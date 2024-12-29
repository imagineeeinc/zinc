import { createUserLink, getSocketId, removeLink } from './db.js'
export function socketManger(io) {
	io.on('connection', (socket) => {
		socket.on('registerSelf', (data) => {
			createUserLink(data.id, socket.id)
		})
		socket.on('requestMessageFor', (data) => {
			socket.broadcast.emit('anyMessageFor', data.id)
		})
		socket.on('channelTo', async (data) => {
			let socketId = await getSocketId(data.recipient)
			if (!socketId) {
				if (data.meshDisperse) {
					socket.broadcast.emit('channelFrom', {...data, dispersed: true, storeFor: data.recipient})
				}
			}
			socket.in(socketId).emit('channelFrom', data)
		})
		socket.on('messageFromMeshFor', async (data) => {
			let socketId = await getSocketId(data.id)
			if (socketId) {
				socket.in(socketId).emit('messageFromMesh', data.packets)
			}
		})
		socket.on('disconnect', () => {
			removeLink(socket.id)
		})
	})
}