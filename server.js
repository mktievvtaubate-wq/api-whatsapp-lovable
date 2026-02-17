const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;

// Inicia a conexão com o WhatsApp
wppconnect
  .create({
    session: 'sessao-zap',
    headless: true, // true = não abre navegador; false = abre para você ver
    logQR: true,    // Mostra o QR Code no terminal
    catchQR: (base64Qr, asciiQR) => {
      console.log(asciiQR); // Garante que o QR Code apareça
    },
    statusFind: (statusSession, session) => {
      console.log('Status da Sessão:', statusSession);
    },
  })
  .then((client) => {
    startServer(client);
  })
  .catch((error) => console.log(error));

function startServer(client) {
  // Rota para enviar mensagem
  app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    try {
      // Adiciona o código do país se não tiver (ex: assume 55 Brasil) e o sufixo @c.us
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      
      await client.sendText(formattedPhone, message);
      console.log(`Mensagem enviada para ${phone}`);
      res.json({ status: 'success' });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ status: 'error' });
    }
  });

  // Rota para envio em massa
  app.post('/send-bulk', async (req, res) => {
    const { numbers, message } = req.body;
    
    res.json({ status: 'Enviando em segundo plano...' });

    for (const num of numbers) {
      try {
        await client.sendText(`${num}@c.us`, message);
        // Espera 5 segundos entre mensagens para não tomar ban
        await new Promise(r => setTimeout(r, 5000)); 
      } catch (e) {
        console.log('Erro ao enviar para ' + num);
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor pronto em http://localhost:${PORT}`);
  });
}