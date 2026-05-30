const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS для всех запросов
app.use(cors());
app.use(express.json());

// Простой тестовый эндпоинт
app.get('/', (req, res) => {
  res.json({ 
    message: 'CORS прокси работает!',
    usage: '/proxy/адрес-сайта/путь'
  });
});

// Основной прокси-эндпоинт
app.all('/proxy/*', async (req, res) => {
  try {
    // Получаем целевой URL из параметров
    let targetUrl = req.params[0];
    
    // Добавляем протокол если его нет
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    console.log('Проксируем запрос к:', targetUrl);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host
      }
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Ошибка проксирования',
      message: error.message
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
