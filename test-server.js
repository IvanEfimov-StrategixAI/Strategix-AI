const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
    res.send('Strategix AI работает!');
});

app.listen(PORT, () => {
    console.log(`🚀 Тестовый сервер запущен на порту ${PORT}`);
});

module.exports = app;