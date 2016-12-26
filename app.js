var express = require('express');
var http = require('http');
var fs = require('fs');

var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
var socket = require('socket.io')(server);

var initialPieces, pieces = new Object();

fs.readFile('default.json', 'utf8', function (err, data) {
    initialPieces = JSON.parse(data);
    
    socket.on('connection', function(client) {
        
        client.on('setRoom', function(roomId) {
            pieces[roomId] = JSON.parse(data);
        });
        
        client.on('requestInit', function(roomId) {
            client.emit('init', JSON.stringify(pieces[roomId]));
        });
        
        client.on('placePiece', function(data) {
            console.log('placePiece');
            pieces[data.roomId][data.pieceMoved.index] = data.pieceMoved.piece;
            if (data.pieceEaten != null) {
                pieces[data.roomId][data.pieceEaten].eaten = true;
            }
            client.broadcast.emit('updatePieces', JSON.stringify(pieces[data.roomId]));
        });
    });
});

server.listen(8080, function() {
	console.log('Running on port 8080...');
});
