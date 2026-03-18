/**
 * Client Environment Variables Check
 * Returns HTML page that checks client-side env vars
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Client Env Debug</title>
  <style>
    body {
      font-family: monospace;
      padding: 20px;
      background: #1a1a1a;
      color: #00ff00;
    }
    .exists { color: #00ff00; }
    .missing { color: #ff0000; }
    pre {
      background: #000;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>🔍 Client-Side Environment Variables</h1>
  <p>These values are what the browser sees (baked into client bundle during build)</p>

  <div id="results"></div>

  <script>
    const results = document.getElementById('results');

    function checkEnv(key) {
      const value = process.env[key];
      const exists = typeof value !== 'undefined' && value !== null;

      let preview = 'undefined';
      if (exists) {
        preview = value.length > 20
          ? value.slice(0, 10) + '...' + value.slice(-10)
          : value;
      }

      return {
        key,
        exists,
        value: exists ? preview : null,
        length: exists ? value.length : 0
      };
    }

    const envVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    const checks = envVars.map(checkEnv);

    results.innerHTML = '<pre>' + JSON.stringify(checks, null, 2) + '</pre>';

    // Also log to console
    console.log('Client Environment Variables:', checks);
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
