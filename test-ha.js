require('dotenv').config();

const HA_WEBHOOK_URL = process.env.HA_WEBHOOK_URL;

if (!HA_WEBHOOK_URL) {
    console.error('❌ ERRO: A variável HA_WEBHOOK_URL não está definida no arquivo .env.');
    process.exit(1);
}

const mockDeliveries = [
    {
        id: "TESTE-123",
        unidade: "Apto 101",
        tipo: "Pacote Grande",
        remetente: "Mercado Livre",
        dataRecebimento: new Date().toLocaleDateString('pt-BR'),
        status: "Aguardando Retirada",
        dataStatus: "",
        quemRetirou: ""
    }
];

const mockRetiradas = [
    {
        id: "TESTE-456",
        unidade: "Apto 101",
        tipo: "Envelope",
        remetente: "Correios",
        dataRecebimento: new Date().toLocaleDateString('pt-BR'),
        status: "Retirada por Walison Souza Dos Santos",
        dataStatus: `${new Date().toLocaleDateString('pt-BR')} 09:18`,
        quemRetirou: "Walison Souza Dos Santos"
    }
];

async function testarWebhook() {
    console.log(`Disparando webhook de teste simulado para o Home Assistant...`);
    console.log(`URL: ${HA_WEBHOOK_URL}`);
    console.log(`Conteúdo enviado:`, JSON.stringify(mockDeliveries, null, 2));

    try {
        const responsePendentes = await fetch(HA_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                evento: "NOVA_ENCOMENDA",
                quantidade: mockDeliveries.length,
                entregas: mockDeliveries,
                total_pendentes: mockDeliveries.length
            })
        });

        if (responsePendentes.ok) {
            console.log('✅ SUCESSO! HA recebeu notificação de NOVAS ENCOMENDAS.');
        } else {
            console.error(`❌ Erro HA (Novas): ${responsePendentes.status}`);
        }

        const responseRetiradas = await fetch(HA_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                evento: "ENCOMENDA_RETIRADA",
                quantidade: mockRetiradas.length,
                entregas: mockRetiradas,
                total_pendentes: mockDeliveries.length
            })
        });

        if (responseRetiradas.ok) {
            console.log('✅ SUCESSO! HA recebeu notificação de RETIRADAS.');
        } else {
            console.error(`❌ Erro HA (Retiradas): ${responseRetiradas.status}`);
        }

    } catch (error) {
        console.error('❌ Falha ao tentar conectar com a URL do Home Assistant:', error.message);
    }
}

testarWebhook();
