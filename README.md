# Condfy Monitor

Este é um script de automação (RPA) desenvolvido em Node.js com [Playwright](https://playwright.dev/). Ele tem como objetivo fazer login na plataforma web do Condfy, verificar a listagem de correspondências da sua unidade e emitir alertas no console quando houver correspondências pendentes de retirada.

O projeto já está preparado para ser executado tanto localmente quanto em containers (Docker/Coolify).

## Pré-requisitos

- **Node.js** (v18 ou superior recomendado)
- **Docker** (opcional, para rodar em container)

## Variáveis de Ambiente

O script necessita das seguintes variáveis de ambiente para funcionar corretamente. Você pode criar um arquivo `.env` na raiz do projeto ou configurá-las no seu ambiente (como no Coolify):

```env
# Credenciais de acesso ao Condfy
CONDFY_USER=seu_usuario@email.com
CONDFY_PASS=sua_senha

# Opcional: Intervalo em minutos entre as checagens (Padrão: 30)
CHECK_INTERVAL_MINUTES=30

# Opcional: URL do Webhook do Home Assistant para receber os dados
HA_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/seu_webhook_id
```

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Instale os navegadores do Playwright (se for a primeira vez rodando Playwright na máquina):
   ```bash
   npx playwright install chromium
   ```

3. Execute o script:
   ```bash
   npm start
   ```

> **Nota:** Quando executado localmente, o script roda em background (headless). Ele fará a verificação inicial e depois continuará rodando de acordo com o intervalo definido em `CHECK_INTERVAL_MINUTES`.

## Como rodar com Docker

O projeto já possui um `Dockerfile` otimizado utilizando a imagem oficial da Microsoft para o Playwright, o que garante que todas as dependências do sistema operacional necessárias para rodar navegadores "headless" estejam instaladas.

1. Faça o build da imagem:
   ```bash
   docker build -t condfy-monitor .
   ```

2. Execute o container, passando as variáveis de ambiente:
   ```bash
   docker run -d --name condfy-monitor \
     -e CONDFY_USER='seu_usuario' \
     -e CONDFY_PASS='sua_senha' \
     -e CHECK_INTERVAL_MINUTES=30 \
     condfy-monitor
   ```

## Hospedagem / Deployment (Coolify)

Como o projeto já está "containerizado", o deploy em ferramentas como **Coolify** é simples:
1. Conecte este repositório no seu painel do Coolify.
2. Nas configurações do projeto no Coolify, adicione as variáveis de ambiente `CONDFY_USER`, `CONDFY_PASS` e `CHECK_INTERVAL_MINUTES`.
3. Certifique-se de que o Coolify está configurado para usar o `Dockerfile` presente na raiz do projeto (geralmente ele detecta automaticamente).
4. Realize o deploy. O container ficará rodando continuamente, realizando o loop de checagem conforme o intervalo configurado.
