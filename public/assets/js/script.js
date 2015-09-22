$(function() {
    if(!('getContext' in document.createElement('canvas'))) {
        alert('Sorry, it looks like your browser does not support canvas!');
        return false;
    }

    var url = 'http://localhost:8080';

    var doc     = $(document),
        win     = $(window),
        canvas  = $('#paper'),
        ctx     = canvas[0].getContext('2d'),
        instructions = $('#instructions');

    // generate an unique ID (at least try to be)
    var id = Math.round($.now()*Math.random());

    // a flag for drawing activity
    var drawing = false;

    var clients = {}, cursors = {};

    var socket = io.connect(url);

    socket.on('moving', function(data) {
        if(!(data.id in clients)) {
            // a new user has come online create a cursor for them
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        //move the mouse pointer
        cursors[data.id].css({
            'left'      : data.x,
            'top'       : data.y
        });

        // user is drawing
        if(data.drawing && clients[data.id]) {

            // Draw a line on the canvas. clients[data.id] holds
            // previous position of this user's mouse pointer
            drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
        }

        //saving the current client state
        clients[data.id] = data;
        clients[data.id].updated = $.now();
    });

    var prev = {x: 0, y:0};

    canvas.on('mousedown', function(e) {
        e.preventDefault();
        drawing = true;
        prev.x = e.pageX;
        prev.y = e.pageY;

        // hide the instructions
        // instructions.fadeOut();
    });

    doc.bind('mouseup mouseleave', function() {
        drawing = false;
    });

    var lastEmit = $.now();

    doc.on('mousemove', function(e) {
        if($.now() - lastEmit > 30) {
            socket.emit('mousemove', {
                'x': e.pageX,
                'y': e.pageY,
                'drawing': drawing,
                'id': id
            });
            lastEmit = $.now();

        }

        if(drawing) {
            drawLine(prev.x, prev.y, e.pageX, e.pageY);
            prev.x = e.pageX;
            prev.y = e.pageY;
        }

    });


    setInterval(function() {
        for(ident in clients) {
            if($.now() - clients[ident].updated > 10000) {

                // Last update was more than 10 secs ago.
                // this user probably closed the page
                
                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
        }
    }, 10000);

    function drawLine(fromx, fromy, tox, toy) {
        console.log(fromx + " " + fromy);
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
    }

});
