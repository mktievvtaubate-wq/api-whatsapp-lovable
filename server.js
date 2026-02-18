const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// AJUSTE 1: A porta agora é dinâmica (o servidor escolhe) ou 3001 se for no seu PC
const PORT = process.env.PORT || 3001;

// Inicia a conexão com o WhatsApp
wppconnect
  .create({
    session: 'sessao-zap',
    headless: true, 
    logQR: true,
    // AJUSTE 2: Argumentos obrigatórios para rodar em servidores Linux (Render/AWS)
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    catchQR: (base64Qr, asciiQR) => {
      console.log(asciiQR); 
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
        await new Promise(r => setTimeout(r, 5000)); 
      } catch (e) {
        console.log('Erro ao enviar para ' + num);
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor pronto na porta ${PORT}`);
  });
}