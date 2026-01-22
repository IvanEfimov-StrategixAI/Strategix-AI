// ФАЙЛ ДЛЯ ИСПРАВЛЕНИЯ КОНЦА server.js

// Откройте server.js, удалите все после примерно строки 9880
// и вставьте этот код

app.get('/api/test-simple', (req, res) => {
    res.json({ success: true, message: 'Сервер работает!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;