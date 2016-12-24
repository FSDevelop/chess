var express = require('express');
var http = require('http');
var fs = require('fs');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
var socket = require('socket.io')(server);

socket.on('connection', function(client) {
    fs.readFile('default.json', 'utf8', function (err, data) {
        client.emit('init', data);
    });
});

server.listen(8080, function() {
	console.log('Running on port 8080...');
});