FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm ci && npx prisma generate

CMD ["npm", "run", "dev"]