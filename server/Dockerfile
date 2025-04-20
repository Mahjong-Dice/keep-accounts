FROM node:20-alpine

WORKDIR /app

RUN npm run build:docker

COPY dist/ .
COPY prisma/ .

RUN npm install

RUN npx prisma generate

CMD ["node", "index.js"]