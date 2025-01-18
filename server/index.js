import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { handler } from '../build/handler.js'
import { socketManger } from './socket.js'

const port = 3000 || process.env.PORT

const app = express()
const server = createServer(app)

const io = new Server(server, {
	maxHttpBufferSize: 1e9
})
socketManger(io)

app.use(handler)

server.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`)
})