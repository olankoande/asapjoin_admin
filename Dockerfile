# Étape 1: Build de l'application React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# AJOUT POUR COOLIFY: Récupération de l'argument de build
ARG VITE_API_BASE_URL
# Injection comme variable d'environnement pour la commande 'npm run build'
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# La variable VITE_API_BASE_URL est injectée par docker-compose pour pointer vers le backend
# Par défaut, elle pointera vers l'URL configurée dans votre .env ou .env.production
RUN npm run build

# Étape 2: Service avec Nginx
FROM nginx:1.25-alpine

# Copier les fichiers statiques depuis l'étape de build
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée pour gérer le routage de la SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]