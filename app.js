var express = require('express');
var http = require('http');
var fs = require('fs');
var bodyParser = require('body-parser');

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var server = http.createServer(app);
var socket = require('socket.io')(server);

var initialPieces, pieces = new Object(), players = new Object();

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
            
            var dataEmit = {
                pieces: pieces[roomId]
            };
            
            if (players[roomId] != null) {
                dataEmit.players = players[roomId];
            }
            
            client.emit('init', JSON.stringify(dataEmit));
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

/**
 * Hipchat integration/notifications
 */
app.post('/generateRoom', function(req, res) {
    fs.readFile('default.json', 'utf8', function (err, data) {
        var roomId = Math.floor(Math.random() * 10000);
        pieces[roomId] = JSON.parse(data);
        players[roomId] = {
            player1: req.body.item.message.from.mention_name,
            player2: req.body.item.message.message.split('/chess @')[1];
        };
        
        res.send({
            "color": "green",
            "message": "Play now: http://" + process.env.CHESS_DOMAIN + ":8080/?g=" + roomId,
            "notify": false,
            "message_format": "text"
        });
    });
});

server.listen(8080, function() {
	console.log('Running on port 8080...');
});
