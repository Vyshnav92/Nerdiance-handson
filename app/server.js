const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>HandsOn SRE Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 500px; margin: 60px auto; text-align: center; }
    #status { padding: 10px; border-radius: 6px; margin-top: 20px; }
    .ok { background: #d4f7dc; color: #14532d; }
  </style>
</head>
<body>
  <h1>HandsOn SRE Demo App</h1>
  <p>A minimal frontend calling the backend API below.</p>
  <div id="status">Loading...</div>
  <script>
    fetch('/api/info')
      .then(r => r.json())
      .then(data => {
        document.getElementById('status').innerHTML =
          'Backend responding<br>Host: ' + data.hostname + '<br>Time: ' + data.timestamp;
        document.getElementById('status').className = 'ok';
      })
      .catch(() => {
        document.getElementById('status').innerText = 'Backend unreachable';
      });
  </script>
</body>
</html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/info', (req, res) => {
  res.json({ hostname: require('os').hostname(), timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`App listening on port ${PORT}`);
});
