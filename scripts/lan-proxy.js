#!/usr/bin/env node
'use strict';

const http = require('http');

const targetPort = Number(process.env.VRIDHI_PROXY_TARGET || 3001);
const listenPort = Number(process.env.VRIDHI_PROXY_PORT || 8787);

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: `127.0.0.1:${targetPort}` };
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`proxy error: ${err.message}`);
  });
  req.pipe(proxyReq);
});

server.listen(listenPort, '0.0.0.0', () => {
  process.stdout.write(
    `LAN proxy 0.0.0.0:${listenPort} -> 127.0.0.1:${targetPort}\n`,
  );
});
