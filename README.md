---

# 🚀 ONFLY Fullstack — Backend (Laravel) & Frontend (Quasar)

Ambiente de desenvolvimento **Laravel + Quasar (Vue 3)** totalmente conteinerizado com **Docker Compose**, pronto para rodar localmente sem configurações manuais.

---

## ⚙️ Requisitos

* [Docker Engine + Compose](https://docs.docker.com/get-docker/)
* [Git](https://git-scm.com/)
* Portas **8000**, **9000**, **1025** e **3306** livres

---

## 🧱 Stack utilizada

| Camada       | Tecnologia               | Descrição                                   |
| ------------ | ------------------------ | ------------------------------------------- |
| **Backend**  | PHP 8.4 / Laravel 12     | API REST principal                          |
|              | MySQL 8                  | Banco de dados                              |
|              | Mailhog                  | SMTP local para teste de e-mails            |
|              | Nginx (alpine)           | Servidor web                                |
| **Frontend** | Node 20 / Quasar (Vue 3) | Interface SPA                               |
| **Infra**    | Docker Compose           | Orquestração e rede `app_net` compartilhada |

---

## 🚀 1. Backend — Setup e Execução

### 1️⃣ Clone e entre no projeto

```bash
git clone git@github.com:gabriel777assuncao/Onfly---Technical-Test-fullstack-developer.git
cd app_backend
```

### 2️⃣ Configure o ambiente

```bash
cp .env.example .env
```

Verifique os parâmetros de banco e Mailhog:

```env
DB_HOST=mysql
DB_DATABASE=sandbox
DB_USERNAME=sandbox
DB_PASSWORD=sandbox

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_FROM_ADDRESS="no-reply@example.test"
```

### 3️⃣ Suba os containers

```bash
docker compose up -d --build
```

Verifique se estão ativos:

```bash
docker ps
```

Deve listar pelo menos:

```
app_backend-php-1
app_backend-mysql-1
app_backend-mailhog-1
```

### 4️⃣ Instale as dependências e gere chaves

```bash
docker compose run --rm composer install
docker compose exec php sh
```

Dentro do container PHP:

```bash
php artisan key:generate
php artisan jwt:secret --force
php artisan migrate
exit
```

### ⚠️ Caso encontre erro de permissão no diretório `storage/`

Execute dentro do container PHP:

```bash
docker compose exec php sh
```

```bash
mkdir -p storage/logs bootstrap/cache
: > storage/logs/laravel.log
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache
exit
```

### 5️⃣ Teste o backend

```bash
curl -i http://localhost:8000/api/ping
```

✅ Deve retornar:

```json
"pong"
```

---

## 💌 Teste de e-mails (Mailhog)

Envie um teste rápido:

```bash
docker compose exec php sh
```

```php
php artisan tinker
Mail::raw('Teste de e-mail local', function ($m) {
  $m->to('dev@example.test')->subject('Mailhog funcionando!');
});
exit
```

Acesse [http://localhost:8025](http://localhost:8025) e veja o e-mail recebido.

---

## 🧩 2. Frontend — Setup e Execução (Quasar)

### 1️⃣ Vá para o diretório do frontend

```bash
cd ../app_frontend
```

### 2️⃣ Configure o ambiente

```bash
cp .env.example .env
```

O Quasar já lê automaticamente o arquivo `.env`, e a aplicação é configurada para usar a API do Laravel via:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3️⃣ Suba o ambiente de desenvolvimento

```bash
docker compose up -d --build
```

Acesse a aplicação em:
👉 [http://localhost:9000](http://localhost:9000)

### 4️⃣ Teste a integração com o backend

No navegador ou terminal:

```bash
curl -i http://localhost:8000/api/ping
```

E no navegador (abrindo `http://localhost:9000`), o frontend deve se comunicar normalmente com a API Laravel.

---

## 🌐 Rede compartilhada `app_net`

Tanto o backend quanto o frontend usam a mesma rede Docker:

```yaml
networks:
  app_net:
    external: true
```

Assim, o frontend pode se comunicar internamente com o backend via `http://php:9000/api`.

> Dica: sempre suba o **backend primeiro**, para garantir que a `app_net` seja criada antes do frontend.

---

## 🔧 Comandos úteis

| Ação                  | Backend (Laravel)                          | Frontend (Quasar)                     |
| --------------------- | ------------------------------------------ | ------------------------------------- |
| Subir containers      | `docker compose up -d`                     | `docker compose up -d`                |
| Rebuild completo      | `docker compose up -d --build`             | `docker compose up -d --build`        |
| Parar containers      | `docker compose down`                      | `docker compose down`                 |
| Acessar shell         | `docker compose exec php sh`               | `docker compose exec frontend-dev sh` |
| Instalar dependências | `docker compose run --rm composer install` | `npm install` dentro do container     |
| Limpar cache          | `php artisan optimize:clear`               | —                                     |
| Rodar migrações       | `php artisan migrate`                      | —                                     |
| Testar API            | `curl -i http://localhost:8000/api/ping`   | `fetch('/api/ping')` no browser       |

---

## 🧭 Diagnóstico rápido

| Verificação      | Comando                                  | Resultado esperado   |             |
| ---------------- | ---------------------------------------- | -------------------- | ----------- |
| Laravel responde | `curl -i http://localhost:8000/api/ping` | `"pong"`             |             |
| Quasar rodando   | Acessar `http://localhost:9000`          | App visível          |             |
| Mailhog ativo    | `docker compose ps                       | grep mailhog`        | Status “Up” |
| E-mails visíveis | `http://localhost:8025`                  | Interface Mailhog OK |             |

---
## Deploy da Aplicação:

Está disponível em: https://onfly-technical-test-fullstack-deve.vercel.app/

## 👨‍💻 Autor

**Gabriel Costa**
📍 Betim – MG
💼 Fullstack Developer — PHP / Laravel / Docker / Quasar / Vue.js / TypeScript
📧 [gabrielassuncaocosta2@gmail.com](mailto:gabrielassuncaocosta2@gmail.com)

---
