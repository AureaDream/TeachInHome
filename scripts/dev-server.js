const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5500;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8',
  '.wxss': 'text/css; charset=utf-8',
  '.wxml': 'text/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const reqPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(ROOT, reqPath === '/' ? 'prototype/index.html' : reqPath.replace(/^\//, ''));

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    if (stat.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      fs.readFile(indexFile, (err2, data) => {
        if (err2) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        res.setHeader('Content-Type', MIME['.html']);
        res.end(data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err3, data) => {
      if (err3) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      res.setHeader('Content-Type', type);
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/`);
  console.log(`Open prototype order detail: http://localhost:${PORT}/prototype/order-detail.html`);
});