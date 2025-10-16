FROM composer:2.7 AS composer_bin
FROM php:8.4.1-cli-alpine AS vendor

RUN apk add --no-cache git unzip icu-libs libzip oniguruma libpng \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev oniguruma-dev libpng-dev \
    && docker-php-ext-install intl zip mbstring \
    && apk del .build-deps

COPY --from=composer_bin /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_CACHE_DIR=/tmp/composer
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

RUN mkdir -p storage bootstrap/cache \
    && chown -R laravel:laravel storage bootstrap/cache

USER laravel
