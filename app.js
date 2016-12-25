var express = require('express');
var http = require('http');
var fs = require('fs');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
var socket = require('socket.io')(server);

var pieces;

fs.readFile('default.json', 'utf8', function (err, data) {
    pieces = JSON.parse(data);
    
    socket.on('connection', function(client) {
        client.emit('init', JSON.stringify(pieces));
        
        client.on('placePiece', function(data) {
            pieces[data.pieceMoved.index] = data.pieceMoved.piece;
            if (data.pieceEaten != null) {
                pieces[data.pieceEaten].eaten = true;
            }
            client.broadcast.emit('updatePieces', JSON.stringify(pieces));
        });
    });
});

server.listen(8080, function() {
	console.log('Running on port 8080...');
});
