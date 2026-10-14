FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends iverilog \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY iverilog/digital_circuits.v /app/digital_circuits.v
COPY iverilog/backend/package*.json /app/

RUN npm ci --omit=dev

COPY iverilog/backend/server.js /app/server.js

ENV NODE_ENV=production

CMD ["node", "server.js"]
