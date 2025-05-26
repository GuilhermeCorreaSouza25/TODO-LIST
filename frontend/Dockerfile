FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "start"]
