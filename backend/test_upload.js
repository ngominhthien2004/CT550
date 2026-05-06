const http = require('http');

const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req1 = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const token = JSON.parse(data).token;
            console.log('Got token:', token);
            makeRequest(token);
        } catch (e) {
            console.log('Login failed:', data);
        }
    });
});

req1.write(JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
}));
req1.end();

function makeRequest(token) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/users/profile',
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`BODY: ${data}`);
        });
    });

    req.write('------WebKitFormBoundary7MA4YWxkTrZu0gW\r\n');
    req.write('Content-Disposition: form-data; name="displayName"\r\n\r\n');
    req.write('Test Name\r\n');
    req.write('------WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n');
    req.end();
}
