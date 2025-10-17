# 🚀 ONFLY Fullstack — Backend & Frontend

Ambiente de desenvolvimento **Laravel + Vue.js** totalmente conteinerizado com **Docker Compose**, pronto para rodar localmente sem configurações manuais.

---

## 🧩 Estrutura do Projeto

```
Onfly/
├── app_backend/              # Backend Laravel (PHP 8.4)
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx/nginx.conf
│   ├── .env
│   └── ...
│
└── app_frontend/             # Frontend Vue 3 + Vite (Node 20)
    ├── src/
    ├── public/
    ├── nginx/nginx.dev.conf
    ├── docker-compose.yml
    ├── Dockerfile
    ├── .env.development
    └── ...
```

---

## ⚙️ Requisitos

* [Docker Engine + Compose](https://docs.docker.com/get-docker/)
* [Git](https://git-scm.com/)
* Porta **8080**,  **1025**, **5173** e **3306** livres

---

## 🧱 Stack utilizada

| Camada       | Tecnologia             | Descrição                                   |
| ------------ | ---------------------- | ------------------------------------------- |
| **Backend**  | PHP 8.4 / Laravel 12   | API REST principal                          |
|              | MySQL 8                | Banco de dados                              |
|              | Mailhog                | SMTP local para teste de e-mails            |
|              | Nginx (alpine)         | Servidor web                                |
| **Frontend** | Node 20 / Vue 3 + Vite | Interface SPA                               |
|              | Nginx (alpine)         | Proxy + deploy do build                     |
| **Infra**    | Docker Compose         | Orquestração e rede `app_net` compartilhada |

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

Verifique os parâmetros do banco e Mailhog:

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

Verifique:

```bash
docker ps
```

Deve aparecer:

```
app_backend-php-1
app_backend-mysql-1
app_backend-mailhog-1
```

### 4️⃣ Instale dependências

```bash
docker compose run --rm composer install
```

### 5️⃣ Gere a chave e rode migrações

```bash
docker compose exec php sh
php artisan key:generate
php artisan jwt:secret
php artisan migrate
```

### 6️⃣ Teste o backend

```bash
curl -i http://localhost:8080/api/ping
```

✅ Deve retornar:

```json
{"pong": true}
```

---

## 💌 Teste de e-mails (Mailhog)

Envie um teste rápido:

```bash
docker compose exec php sh 
php artisan tinker
```

```php
Mail::raw('Teste de e-mail local', function ($m) {
  $m->to('dev@example.test')->subject('Mailhog funcionando!');
});
exit
```

Acesse [http://localhost:8025](http://localhost:8025) e veja o e-mail recebido.

---

## 🧩 2. Frontend — Setup e Execução

### 1️⃣ Vá para o diretório do frontend

```bash
cd ../app_frontend
```

### 2️⃣ Configure o ambiente dev

```bash
cp .env.example .env.development
```

Defina a API:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3️⃣ Suba o ambiente de desenvolvimento

```bash
docker compose up -d --build frontend-dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### 4️⃣ Suba o ambiente integrado (com Nginx)

```bash
docker compose up -d --build web
```

Acesse: [http://localhost:8080](http://localhost:8080)

O frontend estará servindo o build do Vite, e o Nginx rotearà `/api` para o backend Laravel via `fastcgi_pass`.

---

## 🌐 Rede compartilhada `app_net`

Tanto o backend quanto o frontend utilizam a mesma rede Docker para comunicação interna:

```yaml
networks:
  app_net:
    name: app_net
    driver: bridge
```

Isso permite que o frontend acesse o backend por `http://php:9000` (internamente) e o Nginx resolva `/api` corretamente.

---

## 🔧 Comandos úteis

| Ação                   | Backend                                                   | Frontend                                            |
| ---------------------- |-----------------------------------------------------------| --------------------------------------------------- |
| Subir containers       | `docker compose up -d`                                    | `docker compose up -d`                              |
| Rebuild completo       | `docker compose up -d --build`                            | `docker compose up -d --build`                      |
| Parar containers       | `docker compose down`                                     | `docker compose down`                               |
| Acessar shell          | `docker compose exec php sh`                              | `docker compose exec frontend-dev sh`               |
| Limpar cache           | `docker compose exec php sh -> php artisan optimize:clear`| —                                                   |
| Rodar testes unitários | `docker compose exec php sh -> php artisan test`          | `docker compose run --rm frontend-dev npm run test` |

---

## 🧭 Diagnóstico rápido

| Verificação            | Comando                                  | Resultado esperado |             |
| ---------------------- | ---------------------------------------- | ------------------ | ----------- |
| Laravel responde       | `curl -i http://localhost:8000/api/ping` | `{"pong":true}`    |             |
| Nginx + front roteando | `curl -i http://localhost:8080/api/ping` | `{"pong":true}`    |             |
| Mailhog SMTP ativo     | `docker compose ps                       | grep mailhog`      | Status “Up” |
| E-mails visíveis       | Abrir `http://localhost:8025`            | Interface Mailhog  |             |

---

## 🧑‍💻 Autor

**Gabriel Costa**
📍 Betim – MG
💼 Fullstack Developer — PHP / Laravel / Docker / Vue.js / Typescript
📧 [gabrielassuncaocosta2@gmail.com](mailto:gabrielassuncaocosta2@gmail.com)

---