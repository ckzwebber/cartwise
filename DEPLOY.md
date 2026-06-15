# Deploy — Lista Smart Backend

Guia para subir o backend na VPS Hetzner, rodando como user `deploy` (não-root), atrás de Nginx + PM2, no domínio **listasmart.cakowebber.dev** (Cloudflare).

- **App roda na porta:** `3003` (configurável via `.env`)
- **Process manager:** PM2 (fork mode)
- **Reverse proxy:** Nginx → `127.0.0.1:3003`
- **TLS:** Cloudflare (proxy laranja) — origin pode usar Let's Encrypt ou Cloudflare Origin Cert

> Premissas: Node + pnpm + PM2 + Nginx já instalados na VPS (você já roda outros projetos como o enertracker). O subdomínio `listasmart.cakowebber.dev` já existe na Cloudflare apontando para o IP da VPS.

---

## 1. Variáveis de ambiente

O projeto usa `@nestjs/config` e lê um `.env` na raiz. Variáveis disponíveis:

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | `3003` | Porta em que o NestJS escuta |
| `CORS_ORIGIN` | origens localhost | Lista de origens permitidas, separadas por vírgula |

O `.env` **não** vai para o git (está no `.gitignore`). Use `.env.example` como referência.

`.env` de produção (na VPS):

```env
PORT=3003
CORS_ORIGIN=https://listasmart.cakowebber.dev
```

> Se o app mobile (Expo/React Native) consumir a API direto, adicione as origens dele à lista, separadas por vírgula. Requisições nativas (sem `Origin`) não são bloqueadas por CORS.

---

## 2. Clonar e buildar na VPS

Logado como `deploy`:

```bash
cd ~
git clone <URL_DO_REPO> lista-smart-backend
cd lista-smart-backend

# Instalar dependências (inclui devDeps p/ buildar)
pnpm install

# Criar o .env de produção
cp .env.example .env
nano .env   # ajuste PORT e CORS_ORIGIN

# Compilar TypeScript -> dist/
pnpm build
```

Isso gera `dist/main.js`, que é o entrypoint usado pelo PM2.

---

## 3. Rodar com PM2

O repo já inclui `ecosystem.config.js`. **Ajuste o `cwd`** se você clonou em outro caminho (o default é `/home/deploy/lista-smart-backend`).

```bash
cd ~/lista-smart-backend

# Subir
pm2 start ecosystem.config.js

# Conferir
pm2 status
pm2 logs listasmart-backend --lines 30

# Persistir entre reboots (rode o comando que o pm2 startup imprimir, uma única vez)
pm2 save
pm2 startup   # siga a instrução exibida (provavelmente já configurado p/ os outros apps)
```

Teste local na VPS:

```bash
curl http://127.0.0.1:3003/products | head
```

---

## 4. Nginx

Crie `/etc/nginx/sites-available/listasmart.cakowebber.dev` (precisa de sudo):

```nginx
server {
    listen 80;
    server_name listasmart.cakowebber.dev;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/listasmart.cakowebber.dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. TLS / Cloudflare

O subdomínio já está na Cloudflare. Duas opções para o certificado de origem:

**Opção A — Cloudflare Flexible (mais simples):**
- No painel Cloudflare, SSL/TLS → modo **Flexible**.
- Nginx fica só em `:80` (config acima). Cloudflare faz HTTPS com o usuário.
- Rápido, mas tráfego Cloudflare→VPS é HTTP. OK para projeto acadêmico.

**Opção B — Cloudflare Full (recomendado):**
- SSL/TLS → modo **Full (strict)**.
- Gere um **Origin Certificate** na Cloudflare e instale na VPS, OU use `certbot`:

```bash
sudo certbot --nginx -d listasmart.cakowebber.dev
```

> Se usar Cloudflare Origin Cert + certbot, garanta que o proxy (nuvem laranja) esteja ligado no DNS record.

Confirme que o registro DNS `listasmart` está com o **proxy ligado** (nuvem laranja) apontando pro IP da VPS, igual aos outros subdomínios (enertracker etc).

---

## 6. Verificação final

```bash
curl https://listasmart.cakowebber.dev/products
curl https://listasmart.cakowebber.dev/recommendations/trending
```

Dashboard interativo (visualizador em memória):

```
https://listasmart.cakowebber.dev/
```

---

## 7. Atualizar (deploys futuros)

```bash
cd ~/lista-smart-backend
git pull
pnpm install
pnpm build
pm2 restart listasmart-backend
```

---

## Notas

- **Estado em memória:** os dados (eventos, lista, compras) vivem na RAM do processo. Todo `pm2 restart` / reboot **zera tudo** — é o comportamento esperado deste projeto acadêmico (sem banco). Para repopular dados de demonstração, rode o seed apontando para a URL pública:
  ```bash
  # edite o BASE em seed.js para https://listasmart.cakowebber.dev (ou rode local na VPS contra 127.0.0.1:3003)
  node seed.js
  ```
- **Sem auth:** intencional. A API é pública; `user-id` vai por header sem validação.
- **Memória:** PM2 reinicia o processo se passar de 300M (`max_memory_restart` no ecosystem). Como tudo é em memória e cresce com eventos, isso também limpa estado acumulado em uso prolongado.
