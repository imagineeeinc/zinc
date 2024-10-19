# Documentation

## Development Stack
Svelte web framework paired with SvelteKit and Vite for web app building. Socket.io is used for packet routing. 
## Source Code parts
- `docs/`: Documentation on the rest of the application
- `server/`: Contains server code
  - `index.js`: Production webserver
  - `socket.js`: Packet routing module used during development and production
- `src/`: Contains the main application and client code written in Svelte
  - `lib/`: contains shared components
    - `css/`: contains shared styling
    - `js/`: contains shared modules
  - `routes/`: contains web app routes
- `static/`: contains any static content like images
- `vite.config.js`: configure build options