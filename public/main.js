/**
 * Hipchat Chess v1.0
 * @since   December 2016
 * @author  Fedeirco Sosa (federico.develop@gmail.com)
 */

const TILE_SIZE = 64;

// Background colors
const COLOR_B1 = '#BB9';
const COLOR_B2 = '#252';

// Pieces colors
const COLOR_P1 = '#FFF';
const COLOR_P2 = '#000';

$(function() {
    // Set game display options
    $('#chess').css({ backgroundColor: '#DDD' });
});

var canvas;
var canvasContext;
var socket = io.connect('http://' + window.location.host);
var pieces;

socket.on('init', function(response) {
    pieces = JSON.parse(response);
    startGame();
});

socket.on('updatePieces', function(response) {
    pieces = JSON.parse(response);
});

function startGame() {
    canvas = document.getElementById("chess");
    canvasContext = canvas.getContext("2d");
    
    // Start threat
    setInterval(function() {
        render();
    }, 20);
}

function render() {
    clearCanvas();
    drawMap();
    drawPieces();
}

function clearCanvas() {
    canvas.width = canvas.width;
}

function drawMap() {
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            // Draw position background
            canvasContext.fillStyle = ((i + j) % 2 == 0) ? COLOR_B1 : COLOR_B2;
            canvasContext.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawPieces() {
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            drawPiece(i, j, canvasContext);
        }
    }
}

function drawPiece(x, y, canvasContext) {
    for (var i = 0; i < pieces.length; i++) {
        if (pieces[i].x == x && pieces[i].y == y) {
            if (!pieces[i].selected) {
                var xPos = x * TILE_SIZE + 10;
                var yPos = y * TILE_SIZE + 45;
            } else {
                var xPos = mouseXPosition - 20;
                var yPos = mouseYPosition + 5;
            }
            
            var pieceType = getPieceType(pieces[i].type, pieces[i].player);
            
            // Draw position background
            canvasContext.font = "40px Arial";
            canvasContext.fillStyle = pieces[i].player == "white" ? COLOR_P1 : COLOR_P2;
            canvasContext.fillText(pieceType, xPos, yPos);
        }
    }
}

function getPieceType(type, player) {
    var unicode;
    
    switch (type) {
        case "king": unicode = player == "white" ? "\u2654" : "\u265A"; break;
        case "queen": unicode = player == "white" ? "\u2655" : "\u265B"; break;
        case "rook": unicode = player == "white" ? "\u2656" : "\u265C"; break;
        case "bishop": unicode = player == "white" ? "\u2657" : "\u265D"; break;
        case "knight": unicode = player == "white" ? "\u2658" : "\u265E"; break;
        case "pawn": unicode = player == "white" ? "\u2659" : "\u265F"; break;
    }
    
    return unicode;
}

var movingPiece = false;

function getPieceIndex(x, y) {
    for (var i = 0; i < pieces.length; i++) {
        if (x >= pieces[i].x * TILE_SIZE && x < (pieces[i].x + 1) * TILE_SIZE) {
            if (y >= pieces[i].y * TILE_SIZE && y < (pieces[i].y + 1) * TILE_SIZE) {
                return i;
            }
        }
    }
}

function selectPiece(x, y) {
    var i = getPieceIndex(x, y);
    
    if (i != undefined) {
        pieces[i].selected = true;
        movingPiece = true;
        movedPiece = pieces[i];
        movedPiece.index = i;
    }
}

function placePiece(x, y) {
    if (isValidPosition()) {
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                if (x >= i * TILE_SIZE && x < (i + 1) * TILE_SIZE) {
                    pieces[movedPiece.index].x = i;
                }
                if (y >= j * TILE_SIZE && y < (j + 1) * TILE_SIZE) {
                    pieces[movedPiece.index].y = j;
                }
            }
        }
        
        pieces[movedPiece.index].selected = false;
        
        var data = {
            piece: pieces[movedPiece.index], 
            index: movedPiece.index
        };
        
        socket.emit('placePiece', data);
        
        movingPiece = false;
    }
}

function isValidPosition() {
    var isValid = false;
    
    var lastPosition = {
        x: pieces[movedPiece.index].x,
        y: pieces[movedPiece.index].y
    };
    
    var x = mouseXPosition;
    var y = mouseYPosition;
    
    var newPosition = new Object();
    
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            if (x >= i * TILE_SIZE && x < (i + 1) * TILE_SIZE) {
                newPosition.x = i;
            }
            if (y >= j * TILE_SIZE && y < (j + 1) * TILE_SIZE) {
                newPosition.y = j;
            }
        }
    }
    
    var frontSense = (movedPiece.player == "white") ? "up" : "down";
    
    switch (movedPiece.type) {
        case "pawn":
            if ((newPosition.y == lastPosition.y - 1 || newPosition.y == lastPosition.y) && 
                newPosition.x == lastPosition.x) {
                isValid = true;
            }
            break;
        case "rook":
            if ((newPosition.y == lastPosition.y && newPosition.x != lastPosition.x) || 
                (newPosition.y != lastPosition.y && newPosition.x == lastPosition.x) || 
                (newPosition.y == lastPosition.y && newPosition.x == lastPosition.x)) {
                isValid = true;
            }
            break;
        case "queen":
            if (((newPosition.y == lastPosition.y && newPosition.x != lastPosition.x) || 
                (newPosition.y != lastPosition.y && newPosition.x == lastPosition.x) || 
                (newPosition.y == lastPosition.y && newPosition.x == lastPosition.x)) ||
                (Math.abs(lastPosition.x - newPosition.x) == Math.abs(lastPosition.y - newPosition.y))) {
                isValid = true;
            }
            break;
        case "bishop":
            if ((Math.abs(lastPosition.x - newPosition.x) == Math.abs(lastPosition.y - newPosition.y))) {
                isValid = true;
            }
            break;
        case "king":
            if (Math.abs(newPosition.x - lastPosition.x) <= 1 && Math.abs(newPosition.y - lastPosition.y) <= 1) {
                isValid = true;
            }
            break;
        case "knight":
            if ((newPosition.x == lastPosition.x && newPosition.y == lastPosition.y) ||
                (Math.abs(newPosition.x - lastPosition.x) == 2 && Math.abs(newPosition.y - lastPosition.y) == 1) ||
                (Math.abs(newPosition.y - lastPosition.y) == 2 && Math.abs(newPosition.x - lastPosition.x) == 1)) {
                isValid = true;
            }
    }
    
    return isValid;
}

var mouseXPosition, mouseYPosition;

window.addEventListener('mousedown', function(e) {
    if (e.isTrusted) {
        if (!movingPiece) {
            selectPiece(e.clientX, e.clientY);
        } else {
            placePiece(e.clientX, e.clientY);
        }
    }
});

window.addEventListener('mousemove', function(e) {
    if (e.isTrusted) {
        mouseXPosition = e.clientX;
        mouseYPosition = e.clientY;
    }
});
