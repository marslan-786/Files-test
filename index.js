const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // آسانی کے لیے سب کو اجازت دیں
  },
});

let phoneSocket = null; // یہاں ہم اپنے "گھر کے کلائنٹ" (فون) کو اسٹور کریں گے

// 1. براؤزر (فائل مینیجر) کو HTML فائل بھیجنا
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. WebSocket کنکشنز کو سنبھالنا
io.on('connection', (socket) => {
  console.log('ایک نیا کلائنٹ کنیکٹ ہوا: ', socket.id);

  // --- فون (کلائنٹ) سے آنے والے ایونٹس ---
  
  // جب اینڈرائیڈ ایپ کنیکٹ ہو کر کہے گی "میں فون ہوں"
  socket.on('phone-handshake', () => {
    console.log('فون آن لائن آ گیا: ', socket.id);
    phoneSocket = socket; // فون کے کنکشن کو محفوظ کر لیں
    
    // فون کو بتائیں کہ وہ رجسٹر ہو گیا ہے۔
    socket.emit('phone-registered', 'آپ کا فون اب سرور سے کنیکٹ ہے');
  });

  // جب فون فائل لسٹ واپس بھیجے گا
  socket.on('phone-sends-list', (fileList) => {
    console.log('فون نے فائل لسٹ بھیجی');
    // یہ لسٹ اب براؤزر کو بھیج دیں
    io.emit('server-sends-list-to-browser', fileList);
  });

  // --- براؤزر (فائل مینیجر) سے آنے والے ایونٹس ---
  
  // جب براؤزر فائل لسٹ مانگے گا
  socket.on('browser-requests-list', () => {
    if (phoneSocket) {
      console.log('براؤزر نے لسٹ مانگی، فون کو کمانڈ بھیج رہے ہیں...');
      // فون کو کمانڈ بھیجیں کہ "فائل لسٹ دو"
      phoneSocket.emit('server-requests-list-from-phone');
    } else {
      console.log('براؤزر نے لسٹ مانگی، لیکن فون آف لائن ہے');
      // براؤزر کو بتائیں کہ فون آف لائن ہے
      io.emit('server-error', 'فون فی الحال آف لائن ہے');
    }
  });

  // جب کوئی ڈسکنیکٹ ہو
  socket.on('disconnect', () => {
    console.log('کلائنٹ ڈسکنیکٹ ہوا: ', socket.id);
    if (phoneSocket && phoneSocket.id === socket.id) {
      console.log('فون آف لائن ہو گیا');
      phoneSocket = null; // فون کو آف لائن مارک کر دیں
      io.emit('server-error', 'فون آف لائن ہو گیا ہے');
    }
  });
});

// سرور کو چلائیں (Vercel اسے خود مینیج کرے گا)
// لوکل ٹیسٹنگ کے لیے: server.listen(3000, () => console.log('سرور 3000 پر چل رہا ہے'));

module.exports = app; // Vercel کے لیے ایکسپورٹ کریں
                
