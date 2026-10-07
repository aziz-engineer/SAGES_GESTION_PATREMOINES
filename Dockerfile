FROM php:8.1-fpm

WORKDIR /var/www

# Installez les dépendances nécessaires
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql zip

# Installez Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copiez le code source
COPY . .

# Installez les dépendances de Laravel
RUN composer install --no-dev --optimize-autoloader

# Commande pour démarrer le serveur intégré de Laravel
CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
