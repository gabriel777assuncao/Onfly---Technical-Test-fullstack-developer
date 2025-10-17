FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
RUN apk add --no-cache bash gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.dev.conf /etc/nginx/conf.d/default.conf
COPY public/env-config.js.template /docker-entrypoint.d/10-envsubst.sh.tmpl
RUN printf '%s\n' '#!/bin/sh' \
    'envsubst < /docker-entrypoint.d/10-envsubst.sh.tmpl > /usr/share/nginx/html/env-config.js' \
    > /docker-entrypoint.d/10-envsubst.sh \
    && chmod +x /docker-entrypoint.d/10-envsubst.sh
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
