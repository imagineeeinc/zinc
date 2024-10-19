import { sequelize, Users } from './db.init.js'

await sequelize.destroyAll()

export function createUserLink(id, socketId) {
	Users.create({ user_id: id, socket_id: socketId })
}

export async function getSocketId(id) {
	return await Users.findOne({ where: { user_id: id } })
}

export function removeLink(id) {
	Users.destroy({ where: { socket_id: id } })
}