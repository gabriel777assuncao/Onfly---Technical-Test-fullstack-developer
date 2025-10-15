# 🚀 ONFLY Backend

Ambiente de desenvolvimento Laravel totalmente conteinerizado com **Docker Compose**, utilizando:

* 🐘 **PHP 8.4**
* 🐳 **Nginx (alpine)**
* 🧱 **MySQL 8.0**
* 📦 **Composer e Artisan containers**

> Este projeto foi criado como ambiente de desenvolvimento Laravel padronizado, fácil de reproduzir em qualquer máquina.

---

## 🧩 Estrutura do Projeto

```
app_backend/
├── app/                # Código principal do Laravel
├── bootstrap/
├── config/
├── database/
├── docker-compose.yaml # Orquestra os serviços Docker
├── dockerfiles/        # (opcional) pasta de Dockerfiles customizados
├── nginx/
│   └── nginx.conf      # Configuração do servidor Nginx
├── public/
├── resources/
├── routes/
├── storage/            # Arquivos gerados em tempo de execução (ignorado no Git)
├── vendor/             # Dependências PHP (ignorado no Git)
├── artisan
├── composer.json
├── composer.lock
├── artisan.sh
└── README.md
```

---

## ⚙️ Requisitos

Antes de começar, garanta que possui instalado:

* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/)
* Git

---

## 🚧 Configuração Inicial

### 1️⃣ Clonar o repositório

```bash
git clone git@github.com:gabriel777assuncao/Onfly---Technical-Test-fullstack-developer.git
cd app_backend
```

---

### 2️⃣ Criar o arquivo `.env`

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

### Construir e subir os containers

```bash
docker compose up -d --build
```

Verifique se tudo subiu:

```bash
docker ps
```

Você deve ver os containers:

* `app_backend-server-1` (Nginx)
* `app_backend-php-1` (PHP-FPM)
* `app_backend-mysql-1` (MySQL)

---

### 4️⃣ Instalar dependências PHP

```bash
docker compose run --rm composer install
```

---

### 5️⃣ Gerar chave da aplicação

```bash
docker compose exec php sh  
php artisan key:generate
```

---

### Rodar as migrações do banco

```bash
docker compose exec php sh  
php artisan migrate
```

---

## 🌐 Acessar o projeto

Abra no navegador:
👉 [http://localhost:8000](http://localhost:8000)

---

## 🧱 Serviços do Docker

| Serviço            | Porta  | Função                   |
| ------------------ | ------ | ------------------------ |
| **server** (Nginx) | `8000` | Servidor web             |
| **php** (PHP-FPM)  | —      | Executa o Laravel        |
| **mysql**          | `3306` | Banco de dados           |
| **composer**       | —      | Gerencia dependências    |
| **artisan**        | —      | Executa comandos Laravel |

---

## 💻 Comandos úteis

| Descrição           | Comando                                             |
|---------------------|-----------------------------------------------------|
| Subir containers    | `docker compose up -d`                              |
| Parar containers    | `docker compose down`                               |
| Rebuild completo    | `docker compose up -d --build`                      |
| Acessar o bash      | `docker compose exec php sh`                        |
| Rodar migrations    | `docker compose run --rm artisan migrate`           |
| Limpar cache        | `docker compose run --rm artisan optimize:clear`    |
| Instalar pacote PHP | `docker compose run --rm composer require <pacote>` |
| Ver logs do PHP     | `docker compose logs -f php`                        |

---

## 🧰 Estrutura de volumes

| Volume           | Descrição                   |
| ---------------- | --------------------------- |
| `dbdata`         | Dados persistentes do MySQL |
| `vendor`         | Cache das dependências PHP  |
| `composer_cache` | Cache do Composer           |

---

## 🛠️ Configuração do Nginx (`nginx/nginx.conf`)

```nginx
server {
    listen 80;
    index index.php index.html;
    root /var/www/html/public;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass php:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

## 🧑‍💻 Autor

**Gabriel Costa**
📍 Betim - MG
💼 Fullstack Developer — PHP / Laravel / Docker / Vue.js / Typescript
📧 [gabrielassuncaocosta2@gmail.com](mailto:gabrielassuncaocosta2@gmail.com)

---