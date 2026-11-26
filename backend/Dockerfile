FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Incluye devDependencies: sequelize-cli (migraciones) se usa al arrancar el contenedor
RUN npm ci
COPY . .
EXPOSE 3000
# node directamente (no "npm start"): así recibe SIGTERM y hace el apagado limpio
CMD ["node", "server.js"]
