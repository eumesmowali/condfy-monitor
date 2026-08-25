require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

const CONDFY_USER = process.env.CONDFY_USER;
const CONDFY_PASS = process.env.CONDFY_PASS;
const CHECK_INTERVAL_MINUTES = process.env.CHECK_INTERVAL_MINUTES || 30;
const LAST_NOTIFIED_FILE = 'last_notified.json';

async function monitorarCorrespondenciasCondfy() {
    console.log(`[${new Date().toISOString()}] Iniciando verificação de correspondências...`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Essencial para rodar dentro de containers Docker
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://web.condfy.com.br/login', { waitUntil: 'networkidle' });

        await page.fill('input[name="username"]', CONDFY_USER);
        await page.fill('input[name="password"]', CONDFY_PASS);
        await page.click('button[type="submit"]');

        try {
            await page.waitForSelector('a[aria-label="Entregas"]', { timeout: 20000 });
            await page.click('a[aria-label="Entregas"]');
        } catch (e) {
            console.log('⚠️ Botão Entregas não apareceu. Tentando acessar a URL diretamente...');
            await page.goto('https://web.condfy.com.br/licencas/24027/correspondencias', { waitUntil: 'networkidle' });
        }
        await page.waitForSelector('table.MuiTable-root tbody tr', { timeout: 10000 });

        const correspondencias = await page.evaluate(() => {
            const rows = document.querySelectorAll('table.MuiTable-root tbody tr');
            const results = [];

            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length >= 5) {
                    const idElement = cols[1].querySelector('p.MuiTypography-body2');
                    const id = idElement ? idElement.innerText.trim() : '';
                    const unidadeElement = cols[1].querySelector('span.MuiTypography-body1');
                    const unidade = unidadeElement ? unidadeElement.innerText.trim() : '';
                    const tipoElements = cols[2].querySelectorAll('p');
                    const tipo = tipoElements[0] ? tipoElements[0].innerText.trim() : '';
                    const remetente = tipoElements[1] ? tipoElements[1].innerText.trim() : 'Não informado';
                    const recebimentoElements = cols[3].querySelectorAll('p');
                    const dataRecebimento = recebimentoElements[0] ? recebimentoElements[0].innerText.trim() : '';
                    const situacaoElements = cols[4].querySelectorAll('p');
                    const status = situacaoElements[0] ? situacaoElements[0].innerText.trim() : '';

                    results.push({ id, unidade, tipo, remetente, dataRecebimento, status });
                }
            });
            return results;
        });

        const pendentes = correspondencias.filter(c => !c.status.toLowerCase().includes('retirada'));

        let lastNotifiedIds = [];
        if (fs.existsSync(LAST_NOTIFIED_FILE)) {
            lastNotifiedIds = JSON.parse(fs.readFileSync(LAST_NOTIFIED_FILE, 'utf8'));
        }

        const currentIds = pendentes.map(c => c.id);
        const newDeliveries = pendentes.filter(c => !lastNotifiedIds.includes(c.id));

        if (newDeliveries.length > 0) {
            console.log(`⚠️ ATENÇÃO: Existem ${newDeliveries.length} NOVA(S) correspondência(s) pendente(s)!`);

            if (process.env.HA_WEBHOOK_URL) {
                try {
                    await fetch(process.env.HA_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            quantidade: newDeliveries.length,
                            entregas: newDeliveries,
                            total_pendentes: pendentes.length
                        })
                    });
                    console.log(`✅ Webhook enviado ao HA.`);
                } catch (err) {
                    console.error('❌ Erro ao enviar webhook para o HA:', err.message);
                }
            }

            // Atualiza o arquivo de controle com todas as correspondências atualmente pendentes
            fs.writeFileSync(LAST_NOTIFIED_FILE, JSON.stringify(currentIds));
        } else if (pendentes.length > 0) {
            console.log(`✅ Existem ${pendentes.length} correspondência(s) pendente(s), mas já foram notificadas anteriormente.`);
        } else {
            console.log('✅ Nenhuma correspondência pendente no momento.');
            // Limpa o arquivo caso não tenha mais nada pendente
            if (fs.existsSync(LAST_NOTIFIED_FILE)) {
                fs.writeFileSync(LAST_NOTIFIED_FILE, JSON.stringify([]));
            }
        }

    } catch (error) {
        console.error('Erro durante a execução do RPA:', error);
    } finally {
        await browser.close();
    }
}

// Execução inicial
monitorarCorrespondenciasCondfy();

// Loop opcional para rodar periodicamente se o container ficar ativo
setInterval(() => {
    monitorarCorrespondenciasCondfy();
}, CHECK_INTERVAL_MINUTES * 60 * 1000);

// Servidor web simples para expor o screenshot de erro
const http = require('http');
http.createServer((req, res) => {
    if (req.url === '/error.png' || req.url === '/') {
        if (fs.existsSync('error.png')) {
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(fs.readFileSync('error.png'));
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Nenhum erro registrado no momento. O robô está rodando perfeitamente!');
        }
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(3000, () => {
    console.log('🌐 Servidor de debug ativo na porta 3000. Acesse para ver o último erro.');
});
