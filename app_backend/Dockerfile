FROM composer:2.5.7 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts

FROM php:8.4.1-fpm-alpine

RUN apk add --no-cache icu-libs libzip oniguruma libpng

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev oniguruma-dev libpng-dev \
    && docker-php-ext-install pdo_mysql intl zip mbstring \
    && docker-php-ext-enable opcache \
    && apk del .build-deps

RUN addgroup -g 1000 laravel \
    && adduser -G laravel -g laravel -s /bin/sh -D laravel

WORKDIR /var/www/html

COPY --chown=laravel:laravel . ./
COPY --from=vendor /app/vendor ./vendor

COPY artisan.sh /usr/local/bin/artisan
RUN chmod +x /usr/local/bin/artisan || true

RUN mkdir -p storage bootstrap/cache \
    && chown -R laravel:laravel storage bootstrap/cache

USER laravel
