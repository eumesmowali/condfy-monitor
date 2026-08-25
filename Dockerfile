# Usando a imagem oficial do Playwright que já contém todas as dependências de sistema necessárias
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do Node.js
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Comando para iniciar a aplicação com uma tela virtual (Xvfb)
CMD ["xvfb-run", "--server-args=-screen 0 1280x1024x24", "-a", "node", "index.js"]
