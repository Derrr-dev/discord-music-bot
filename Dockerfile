FROM node:20-alpine

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p data

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
