FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends iverilog \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/iverilog/backend

COPY iverilog/backend/package*.json ./

RUN npm ci --omit=dev

COPY iverilog/backend/server.js ./server.js
COPY iverilog/digital_circuits.v /app/iverilog/digital_circuits.v

ENV NODE_ENV=production

CMD ["node", "server.js"]