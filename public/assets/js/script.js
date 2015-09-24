$(function() {
    if(!('getContext' in document.createElement('canvas'))) {
        alert('Sorry, it looks like your browser does not support canvas!');
        return false;
    }

    var url = 'http://localhost:8080';
    var socket = io.connect(url);

    var doc     = $(document),
        win     = $(window),
        canvas  = $('#paper'),
        ctx     = canvas[0].getContext('2d'),
        instructions = $('#instructions');

//--------- WebRTC------------------------------------------------
    var localStream, pc, started = false, live = false
    
        // get user media navigator setup
    navigator.getUserMedia = navigator.getUserMedia 
                            || navigator.mozGetUserMedia 
                            || navigator.webkitGetUserMedia;
    window.URL = window.URL 
                || window.webkitURL 
                || window.mozURL;
    var RTCPeerConnection = window.RTCPeerConnection 
                        || window.webkitRTCPeerConnection 
                        || window.mozRTCPeerConnection;

    var RTCIceCandidate = window.RTCIceCandidate 
                    || window.webkitRTCIceCandidate
                    || window.mozRTCIceCandidate;

    var RTCSessionDescription = window.RTCSessionDescription
                            || window.webkitRTCSessionDescription
                            || window.mozRTCSessionDescription;

        // document elements
    var localVideo = document.getElementById('localVideo'),
        remoteVideo = document.getElementById('remoteVideo'),
        startButton = document.getElementById('start'),
        hangupButton = document.getElementById('hangup'),
        callButton = document.getElementById('call');

        //button setup
    startButton.disabled = false;
    startButton.onclick = start;
    callButton.disabled = true;
    callButton.onclick = call;
    hangupButton.disabled = true;
    hangupButton.onclick = hangup;

        // constrants
    var constraints = {
        video   : true,
        audio   : false
    }

    socket.on('media', function(data) {
        console.log(data);
        if(data.type === "offer") {
            gotOffer(data)
        } else if (data.type === "answer") {
            gotAnswer(data);
        }
        callButton.disabled = true;
    });

    function successCallback(localMediaStream) {
        localStream = localMediaStream;
        localVideo.src = window.URL.createObjectURL(localMediaStream);
        callButton.disabled = false;
        localVideo.play();
    }

    function failureCallback(err) {
        console.log(err);
    }

    function start() {
        var servers = null;
        startButton.disabled = true;

        //start getting local video stream
        navigator.getUserMedia(constraints, successCallback, failureCallback);
        pc = new  RTCPeerConnection(servers);
        pc.onicecandidate = gotIceCandidate;
        pc.onaddstream = gotRemoteStream;
    }

    function call() {
        callButton.disabled = true;
        
        pc.addStream(localStream);

        pc.createOffer(startOffer, errHandler);
    }

    function startOffer(offer) {
        if(!started) {
            pc.setLocalDescription(new RTCSessionDescription(offer));
            socket.emit('media', offer);
            started = true;
        }
    }

    function gotAnswer(description) {
        if(!live)
            pc.setRemoteDescription(new RTCSessionDescription(description))
        live = true;
    }


    function gotOffer(description) {
        pc.setRemoteDescription(new RTCSessionDescription(description), function() {
            pc.createAnswer(function(answer) {
                pc.setLocalDescription(answer);
                if(!live)
                    socket.emit('media', answer);
                live = true;
            }, errHandler);
        });
    }

    function hangup() {
        pc.close();
        pc = null;
        hangupButton.disabled = true;
        callButton.disabled = false;
    }

    function gotRemoteStream(event) {
        console.log("got remoteStream");
        console.log(event.stream);
        remoteVideo.src = window.URL.createObjectURL(event.stream);
        remoteVideo.play();
    }

    function gotIceCandidate(event) {
        console.log("got candidate");
        console.log(event.candidate);
        if(event.candidate)
            pc.addIceCandidate(new RTCIceCandidate(event.candidate));
    }

    function errHandler(err) {
        console.log(err);
    }


//------WebRTC end ---------------------

    // generate an unique ID (at least try to be)
    var id = Math.round($.now()*Math.random());

    // a flag for drawing activity
    var drawing = false;

    var clients = {}, cursors = {};


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
