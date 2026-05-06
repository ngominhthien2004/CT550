const express = require('express');
const multer = require('multer');
const app = express();

app.use(multer().fields([{name: 'avatar'}]));
app.use((req, res, next) => res.json({ok: true}));
app.use((err, req, res, next) => res.status(500).json({error: err.message, stack: err.stack}));

const request = require('http').request;
const server = app.listen(0, () => {
    const req = request({
        port: server.address().port,
        method: 'POST',
        headers: {'Content-Type': 'multipart/form-data; boundary=--b'}
    }, res => {
        let d='';
        res.on('data', c=>d+=c);
        res.on('end', () => {
            console.log(d);
            server.close();
        });
    });
    req.write('--b\r\nContent-Disposition: form-data; name="avatar"; filename="a.jpg"\r\n\r\na\r\n--b--\r\n');
    req.end();
});
