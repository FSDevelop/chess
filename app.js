var express = require('express');
var http = require('http');
var fs = require('fs');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
var socket = require('socket.io')(server);

var piecesJSON;
var pieces;

fs.readFile('default.json', 'utf8', function (err, data) {
    piecesJSON = data;
    pieces = JSON.parse(piecesJSON);
    
    socket.on('connection', function(client) {
        client.emit('init', piecesJSON);
    });
    
    socket.on('placePiece', function(data) {
        pieces[data.index] = data.piece;
        client.broadcast.emit('updatePieces', JSON.stringify(pieces));
    });
});

server.listen(8080, function() {
	console.log('Running on port 8080...');
});
