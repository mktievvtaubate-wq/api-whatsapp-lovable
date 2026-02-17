// teste.js
fetch('http://localhost:3001/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '5512981773787', // <--- TROQUE PELO SEU NÚMERO (COM DDD)
    message: 'Olá! Sou seu robô falando do VS Code! 🤖'
  })
})
.then(response => response.json())
.then(data => console.log('Resposta do Servidor:', data))
.catch(error => console.error('Erro:', error));