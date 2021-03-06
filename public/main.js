/**
 * Hipchat Chess v0.4-alpha
 * @since   December 2016
 * @author  Fedeirco Sosa (federico.develop@gmail.com)
 */

const TILE_SIZE = 64;

// Background colors
const COLOR_B1 = '#aa8';
const COLOR_B2 = '#252';

// Pieces colors
const COLOR_P1 = '#FFF';
const COLOR_P2 = '#000';

const COLOR_P1_DISABLED = '#cca';
const COLOR_P2_DISABLED = '#141';

var roomId;
var canvas;
var canvasContext;
var socket = io.connect('http://' + window.location.host);
var pieces;
var player1, player2;
var turn;

$(function() {
    // Set game display options
    $('#chess').css({ backgroundColor: '#DDD' });
    
    if (window.location.search == "") {
        roomId = Math.floor( Math.random() * 10000 );
        socket.emit('setRoom', roomId);
        
        setTimeout(function() {
            window.location = "http://" + window.location.host + '?g=' + roomId;
        }, 500);
    } else {
        roomId = window.location.search.split('?g=')[1];
        socket.emit('requestInit', roomId);
    }
});

socket.on('init', function(response) {
    data = JSON.parse(response);
    pieces = data.pieces;
    
    if (data.turn != null) {
        turn = data.turn;
    } else {
        turn = "white";
    }
    
    player1 = data.players["player1"];
    player2 = data.players["player2"];
    
    if (data.players != undefined && player2 != undefined) {
        startGame();
        $('body').append('<h1>Playing: ' + player1 + ' (white) VS ' + player2 + ' (black)</h1>');
    }
});

socket.on('update', function(response) {
    data = JSON.parse(response);
    pieces = data.pieces;
    turn = data.turn;
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
            if (!pieces[i].eaten) {
                if (!pieces[i].selected) {
                    var xPos = x * TILE_SIZE + 10;
                    var yPos = y * TILE_SIZE + 45;
                } else {
                    var xPos = mouseXPosition - 20;
                    var yPos = mouseYPosition + 5;
                }
                
                var pieceType = getPieceType(pieces[i].type, pieces[i].player);
                
                var color1 = (turn == "white") ? COLOR_P1 : COLOR_P1_DISABLED;
                var color2 = (turn == "black") ? COLOR_P2 : COLOR_P2_DISABLED;
                
                // Draw position background
                canvasContext.font = "40px Arial";
                canvasContext.fillStyle = pieces[i].player == "white" ? color1 : color2;
                canvasContext.fillText(pieceType, xPos, yPos);
            }
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
        if (pieces[i].player == turn) {
            pieces[i].selected = true;
            movingPiece = true;
            movedPiece = pieces[i];
            movedPiece.index = i;
        }
    }
}

function placePiece(x, y) {
    var isValid = isValidPosition();
    if (isValid.success) {
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
        pieces[movedPiece.index].movements += 1;
        
        turn = (turn == "white") ? "black" : "white";
        
        var data = {
            pieceMoved: {
                piece: pieces[movedPiece.index], 
                index: movedPiece.index
            },
            pieceEaten: isValid.pieceEaten,
            roomId: roomId,
            turn: turn
        };
        
        socket.emit('placePiece', data);
        
        movingPiece = false;
    }
}

var isValidPosition = function() {
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
    
    // Basic movements restrictions
    switch (movedPiece.type) {
        case "pawn":
            var whiteAdvanceOne = (movedPiece.player == "white" && newPosition.y == lastPosition.y - 1);
            var blackAdvanceOne = (movedPiece.player == "black" && newPosition.y == lastPosition.y + 1);
            var whiteAdvanceTwo = (movedPiece.player == "white" && newPosition.y == lastPosition.y - 2);
            var blackAdvanceTwo = (movedPiece.player == "black" && newPosition.y == lastPosition.y + 2);
            var isFirstMovement = (movedPiece.movements == 0);
            var noAdvance = (newPosition.y == lastPosition.y);
            var noHorizontalMovements = newPosition.x == lastPosition.x;
            
            if (((whiteAdvanceOne || blackAdvanceOne) || 
                ((whiteAdvanceTwo || blackAdvanceTwo) && isFirstMovement) || 
                noAdvance) && noHorizontalMovements) {
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
    
    var pieceEaten = null;
    
    // Verify new position isn't occuped by an ally
    for (var i = 0; i < 32; i++) {
        // It means it's occuped by an ally
        if (pieces[i].x == newPosition.x && pieces[i].y == newPosition.y && 
            i != movedPiece.index && movedPiece.player == pieces[i].player) {
            isValid = false;
        }
            
        // It's occuped by an enemy (eat him)
        if (pieces[i].x == newPosition.x && pieces[i].y == newPosition.y && 
            i != movedPiece.index && movedPiece.player != pieces[i].player) {
            if (pieces[i].type != "king") {
                // Pawns can't eat with normal movement
                if (movedPiece.type == "pawn" && isValid) {
                    isValid = false;
                } else {
                    var whiteAdvanceOne = (movedPiece.player == "white" && newPosition.y == lastPosition.y - 1);
                    var blackAdvanceOne = (movedPiece.player == "black" && newPosition.y == lastPosition.y + 1);
                    if ((whiteAdvanceOne || blackAdvanceOne) && Math.abs(lastPosition.x - newPosition.x) == 1) {
                        pieces[i].eaten = true;
                        pieceEaten = i;
                        isValid = true;
                    } else {
                        isValid = false;
                    }
                }
            }
        }
    }
    
    return {
        success: isValid,
        pieceEaten: pieceEaten
    };
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
