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
        status: "Pendente"
    },
    {
        id: "TESTE-456",
        unidade: "Apto 101",
        tipo: "Envelope",
        remetente: "Correios",
        dataRecebimento: new Date().toLocaleDateString('pt-BR'),
        status: "Pendente"
    }
];

async function testarWebhook() {
    console.log(`Disparando webhook de teste simulado para o Home Assistant...`);
    console.log(`URL: ${HA_WEBHOOK_URL}`);
    console.log(`Conteúdo enviado:`, JSON.stringify(mockDeliveries, null, 2));

    try {
        const response = await fetch(HA_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quantidade: mockDeliveries.length,
                entregas: mockDeliveries,
                total_pendentes: mockDeliveries.length
            })
        });

        if (response.ok) {
            console.log('✅ SUCESSO! O Home Assistant recebeu a notificação perfeitamente.');
        } else {
            console.error(`❌ O HA retornou um erro! Status: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Falha ao tentar conectar com a URL do Home Assistant:', error.message);
    }
}

testarWebhook();
