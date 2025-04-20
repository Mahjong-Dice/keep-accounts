FROM node:20-alpine

WORKDIR /app

COPY dist/ .
COPY prisma/ .

RUN npm install

RUN npx prisma generate

CMD ["node", "index.js"]