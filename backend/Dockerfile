FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Incluye devDependencies: sequelize-cli (migraciones) se usa al arrancar el contenedor
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
