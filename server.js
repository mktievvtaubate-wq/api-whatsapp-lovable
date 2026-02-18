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
      console.log('QR Code novo gerado! Acesse /qrcode para ver.');
    },
    statusFind: (statusSession, session) => {
      console.log('Status da Sessão:', statusSession);
      // Se conectar, limpamos o QR Code da memória
      if (statusSession === 'isLogged' || statusSession === 'qrReadSuccess') {
        qrCodeImage = null;
      }
    },
  })
  .then((client) => {
    startServer(client);
  })
  .catch((error) => console.log(error));

function startServer(client) {
  // Rota VISUAL para ver o QR Code no navegador
  app.get('/qrcode', (req, res) => {
    if (qrCodeImage) {
      // Mostra uma página HTML simples com a imagem
      res.send(`
        <html>
          <head>
            <title>Escanear WhatsApp</title>
            <meta http-equiv="refresh" content="5"> <style>
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
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
            <div style="text-align:center;">
              <h2>Nenhum QR Code disponível</h2>
              <p>O robô já está conectado ou ainda está iniciando.</p>
              <button onclick="window.location.reload()">Atualizar Página</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Suas outras rotas normais...
  app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    try {
      const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      await client.sendText(formattedPhone, message);
      res.json({ status: 'success' });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ status: 'error' });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Servidor pronto na porta ${PORT}`);
  });
}