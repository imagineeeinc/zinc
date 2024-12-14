FROM node:21-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN node scripts/init.db.js
RUN npm run build
RUN npm prune --production

ENV NODE_ENV=production
# ENV PORT=3000

ENTRYPOINT ["npm", "start"]
