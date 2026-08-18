import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    }).on('error', reject);
  });
}

async function test() {
  try {
    const res = await get('/api/v1/attributes/subcategory/6a6851877ab0d9da774eb1e2');
    console.log('Status:', res.statusCode);
    console.log('Attributes:', res.body);
  } catch (e) {
    console.error(e);
  }
}

test();
