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
            if (pieces[roomId] == null) {
                pieces[roomId] = JSON.parse(data);
            }
            client.emit('init', JSON.stringify(pieces[roomId]));
        });
        
        client.on('placePiece', function(data) {
            pieces[data.roomId][data.pieceMoved.index] = data.pieceMoved.piece;
            if (data.pieceEaten != null) {
                pieces[data.roomId][data.pieceEaten].eaten = true;
            }
            client.broadcast.emit('updatePieces', JSON.stringify(pieces[data.roomId]));
        });
    });
});

app.listen(3000, function() {
    console.log('Express in 3000...');
});

app.get('/generateRoom', function(res, req) {
    fs.readFile('default.json', 'utf8', function (err, data) {
        var roomId = Math.floor(Math.random() * 10000);
        pieces[roomId] = JSON.parse(data);
        
        req.send({
            "color": "green",
            "message": "It's going to be sunny tomorrow! (yey)",
            "notify": false,
            "message_format": "text"
        });
    });
});

server.listen(8080, function() {
	console.log('Running on port 8080...');
});
