FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY server.js ./

EXPOSE 8999

CMD ["node", "server.js"]
