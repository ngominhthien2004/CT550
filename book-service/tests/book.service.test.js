const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

function buildRequestOptions(method, path) {
    return {
        method,
        hostname: 'localhost',
        port: 5001,
        path,
        headers: {
            'Content-Type': 'application/json',
        },
    };
}

function makeRequest(method, path, body = null) {
    const options = buildRequestOptions(method, path);

    return new Promise((resolve, reject) => {
        const request = http.request(options, (response) => {
            let responseBody = '';

            response.on('data', (chunk) => {
                responseBody += chunk;
            });

            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                    body: responseBody,
                    headers: response.headers,
                });
            });
        });

        request.on('error', reject);

        if (body !== null) {
            request.write(JSON.stringify(body));
        }

        request.end();
    });
}

function parseJson(response) {
    if (!response.body) {
        return null;
    }

    try {
        return JSON.parse(response.body);
    } catch (error) {
        throw new Error(`Failed to parse response as JSON: ${response.body}`);
    }
}

describe('Book Service Public Endpoints', () => {
    test('health check returns ok status', async () => {
        const response = await makeRequest('GET', '/api/book-service/health');
        const data = parseJson(response);

        assert.equal(response.statusCode, 200);
        assert.deepEqual(data, { status: 'ok', service: 'book-service' });
    });

    test('categories endpoint returns 200 with array', async () => {
        const response = await makeRequest('GET', '/api/book-service/categories');
        const data = parseJson(response);

        assert.equal(response.statusCode, 200);
        assert.ok(Array.isArray(data));
    });

    test('books endpoint returns 200', async () => {
        const response = await makeRequest('GET', '/api/book-service/books');
        const data = parseJson(response);

        assert.equal(response.statusCode, 200);
        assert.ok(data);
    });
});

describe('Book Service Protected Endpoints', () => {
    test('create category without token returns 401', async () => {
        const response = await makeRequest('POST', '/api/book-service/categories', { name: 'Test Category' });

        assert.equal(response.statusCode, 401);
    });

    test('cart endpoint without token returns 401', async () => {
        const response = await makeRequest('POST', '/api/book-service/cart', { bookId: '123', quantity: 1 });

        assert.equal(response.statusCode, 401);
    });

    test('become seller endpoint without token returns 401', async () => {
        const response = await makeRequest('POST', '/api/book-service/seller/become', { bio: 'I want to sell books' });

        assert.equal(response.statusCode, 401);
    });
});
