const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

// Variável para guardar o QR Code visual
let qrCodeImage = null;

// Inicia o WPPConnect
wppconnect
  .create({
    session: 'sessao-zap',
    headless: true,
    logQR: true, // Mantém no terminal por garantia
    autoClose: 0, // 0 = Não desliga sozinho (tempo infinito)
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    catchQR: (base64Qr, asciiQR) => {
      // Aqui é o pulo do gato: Guardamos a imagem do QR Code
      qrCodeImage = base64Qr;
      console.log('QR Code novo gerado! Acesse http://localhost:3001/qrcode para ver.');
    },
    statusFind: (statusSession, session) => {
      console.log('Status da Sessão:', statusSession);
      // Se conectar, limpamos o QR Code da memória
      if (statusSession === 'isLogged' || statusSession === 'inChat' || statusSession === 'qrReadSuccess') {
        qrCodeImage = null;
      }
    },
  })
  .then((client) => {
    startServer(client);
  })
  .catch((error) => console.log('Erro ao iniciar WPPConnect:', error));

function startServer(client) {
  // Rota VISUAL para ver o QR Code no navegador
  app.get('/qrcode', (req, res) => {
    if (qrCodeImage) {
      res.send(`
        <html>
          <head>
            <title>Escanear WhatsApp</title>
            <meta http-equiv="refresh" content="5">
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; font-family: sans-serif; }
              .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              img { max-width: 300px; border: 1px solid #ddd; }
              h2 { color: #333; margin-bottom: 10px; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Escaneie o QR Code</h2>
              <img src="${qrCodeImage}" />
              <p>A página atualiza sozinha a cada 5 segundos.</p>
            </div>
          </body>
        </html>
      `);
    } else {
      res.send(`
        <html>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f0f2f5;">
            <div style="text-align:center;background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color:#00a884;">WhatsApp Conectado! ✅</h2>
              <p>O robô da Ornô Ótica já está logado e pronto para enviar mensagens.</p>
              <button onclick="window.location.reload()" style="padding:10px 20px;background:#00a884;color:white;border:none;border-radius:5px;cursor:pointer;">Atualizar Página</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Rota para o Vision Lenz disparar qualquer tipo de mensagem
  app.post('/send-message', async (req, res) => {
    const { number, clientName, osNumber, deliveryDate, type, message } = req.body;

    try {
      if (!number) return res.status(400).json({ error: 'Número de telefone é obrigatório' });

      // 1. Limpa o número (tira parênteses, traços, etc) e garante o DDI 55
      let cleanNumber = number.replace(/\D/g, '');
      if (!cleanNumber.startsWith('55')) cleanNumber = `55${cleanNumber}`;
      const formattedPhone = `${cleanNumber}@c.us`;

      let textoFinal = message || 'Mensagem da Ornô Ótica.'; 

      // 2. Mapeamento dos tipos de mensagem
      if (type === 'NOVA_OS') {
        textoFinal = `Olá *${clientName}*! 👓\n\nSua Ordem de Serviço (*OS-${osNumber}*) foi gerada com sucesso na *Ornô Ótica*.\n\n📅 Previsão de entrega: *${deliveryDate}*.\n\nAgradecemos a preferência!`;
      } 
      else if (type === 'OCULOS_PRONTO') {
        textoFinal = `Oii *${clientName}*, temos uma ótima notícia! 🎉\n\nSeus novos óculos (Pedido: OS-${osNumber}) já estão prontos e revisados! Você já pode vir retirar conosco na *Ornô Ótica*.\n\nTe esperamos! 👓✨`;
      }
      else if (type === 'POS_VENDA' && message) {
        // Substitui a tag {nome} digitada pelo Admin pelo nome real do cliente
        textoFinal = message.replace('{nome}', `*${clientName}*`);
      }
      else if (type === 'ANIVERSARIO' && message) {
        // Substitui a tag {nome} digitada pelo Admin pelo nome real do cliente
        textoFinal = message.replace('{nome}', `*${clientName}*`);
      }

      // 3. Dispara a mensagem no WhatsApp
      await client.sendText(formattedPhone, textoFinal);
      console.log(`✅ [${type || 'AVULSA'}] Enviado para ${clientName || cleanNumber} (${cleanNumber})`);
      res.json({ status: 'success' });

    } catch (error) {
      console.error('❌ Erro no envio:', error);
      res.status(500).json({ error: 'Falha no envio' });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor da API do WhatsApp rodando na porta ${PORT}`);
  });
}