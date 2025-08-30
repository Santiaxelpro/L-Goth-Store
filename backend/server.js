const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/products', (req, res) => {
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el archivo' });
    }
    res.json(JSON.parse(data));
  });
});

app.post('/add', (req, res) => {
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el archivo' });
    }
    const products = JSON.parse(data);
    products.push(req.body);
    fs.writeFile('productos.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error al escribir el archivo' });
      }
      res.json({ success: true });
    });
  });
});

app.post('/update-price', (req, res) => {
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el archivo' });
    }
    let products = JSON.parse(data);
    const { index, current_price, previous_price } = req.body;
    products[index].current_price = current_price;
    products[index].previous_price = previous_price;
    fs.writeFile('productos.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error al escribir el archivo' });
      }
      res.json({ success: true });
    });
  });
});

app.post('/update-image', (req, res) => {
  fs.readFile('productos.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al leer el archivo' });
    }
    let products = JSON.parse(data);
    const { index, images } = req.body;
    products[index].images = images;
    fs.writeFile('productos.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error al escribir el archivo' });
      }
      res.json({ success: true });
    });
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});