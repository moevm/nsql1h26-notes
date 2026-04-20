FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install

FROM node:22-alpine AS dev
WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=5173

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4173"]

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
