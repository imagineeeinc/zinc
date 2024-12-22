FROM node:23

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build
RUN npm prune --production

ENV NODE_ENV=production
# ENV PORT=3000

ENTRYPOINT ["npm", "start"]
