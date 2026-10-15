FROM node:25-alpine AS builder
RUN apk upgrade --no-cache
RUN npm install -g npm@latest
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm audit fix --force
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:25-alpine
RUN apk upgrade --no-cache
RUN npm install -g npm@latest serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]