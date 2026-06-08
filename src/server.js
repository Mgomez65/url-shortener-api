const express = require('express');
const urlRoutes = require('./url/url.route');

const app = express();

app.use(express.json());
app.use('/', urlRoutes);

app.get('/', (req, res) => {
  res.send('Servidor corriendo. Usa POST /shorten para crear URLs cortas.');
});

const PORT = process.env.HOST_PUERTO || process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});   