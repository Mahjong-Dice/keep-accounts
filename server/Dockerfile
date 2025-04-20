FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npx prisma generate

CMD ["npm", "run", "dev"]