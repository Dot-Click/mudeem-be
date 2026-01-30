# Use Debian slim instead of Alpine to avoid TLS/OpenSSL issues with MongoDB Atlas
# (ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR is common when connecting from Alpine on Railway)
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# COPY ./src/config/config.env ./src/config/config.env
# RUN npm run lint
RUN npm run swagger
RUN npm run build
EXPOSE 8000
CMD ["npm", "run", "start"]