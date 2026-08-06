const multer = require('multer');

const notFound = (req, res, next) => {
  res.status(404).json({ message: 'Rute tidak ditemukan.' });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
};

module.exports = { notFound, errorHandler };