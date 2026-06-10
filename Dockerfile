FROM node:21-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY assets ./assets
COPY auth ./auth
COPY admin ./admin
COPY validator ./validator
COPY shared ./shared
COPY server.js index.html package*.json ./

RUN chown -R appuser:appgroup /app

EXPOSE 8080

USER appuser

CMD ["node", "server.js"]
