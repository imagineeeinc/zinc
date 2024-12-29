import { openKv } from "@deno/kv"

const kv = await openKv("")

export async function createUserLink(id, socketId) {
	await kv.set([id], socketId)
	await kv.set(["reverse", socketId], id)
}

export async function getSocketId(id) {
	let res = await kv.get([id])
	if (!res.value) {
		res = await kv.get(["reverse", id])
	}
	return res.value
}

export async function removeLink(sid) {
	let id = await kv.get(["reverse", sid])
	if (!id.value) return
	await kv.delete([id.value])
	await kv.delete(["reverse", sid])
}