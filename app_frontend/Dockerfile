FROM node:20-alpine

WORKDIR /app
EXPOSE 9000

RUN apk add --no-cache git
ENV npm_config_cache=/home/node/.npm

CMD ["sh", "-c", "npm ci && npx quasar dev --host 0.0.0.0"]
