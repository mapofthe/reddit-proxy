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
    
    // Очищаем заголовки, которые могут выдать прокси
    const cleanHeaders = { ...req.headers };
    delete cleanHeaders.host;
    delete cleanHeaders.origin;
    delete cleanHeaders.referer;
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        ...cleanHeaders,
        // Притворяемся обычным браузером
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      // Не выбрасывать ошибку при не-200 статусах
      validateStatus: function (status) {
        return status < 500; // Принимаем все статусы кроме 5xx
      }
    });

    // Передаём заголовки ответа
    if (response.headers['content-type']) {
      res.set('Content-Type', response.headers['content-type']);
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Ошибка проксирования',
      message: error.message,
      details: error.response?.data || 'Нет дополнительной информации'
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
