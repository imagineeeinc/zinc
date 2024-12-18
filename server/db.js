import { openKv } from "@deno/kv"

const kv = await openKv("")

export async function createUserLink(id, socketId) {
	await kv.set([id], socketId)
}

export async function getSocketId(id) {
	let res = await kv.get([id])
	return res.value
}

export async function removeLink(id) {
	await kv.delete([id])
}