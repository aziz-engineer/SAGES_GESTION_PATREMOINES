# Utiliser une image officielle de Node.js comme image de base
FROM node:16-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste du code source dans le répertoire de travail du conteneur
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Commande pour démarrer l'application en mode développement
CMD ["npm", "run", "dev"]
