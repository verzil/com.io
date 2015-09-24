var     express         = require('express'),
        app             = express(),
        server          = require('http').createServer(app)
        socket          = require('socket.io'),
        morgan          = require('morgan'),
        io              = socket.listen(server);

// sets the environment
if(process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = 'dev';
}

// set up the public folder
app.use(express.static('public'));

// morgan for loging requests
app.use(morgan('dev'));

// routes 
app.use(require('./server/routes.js'));


// listen for incomming connection from clients
io.sockets.on('connection', function(socket) {
    console.log("connection on socket:", socket);

    //sends the event(broadcasting) it to everyone
    //except the origin
    socket.on('mousemove', function(data) {
        socket.broadcast.emit('moving', data);
    });

    socket.on('media', function(data) {
<<<<<<< HEAD
        console.log('media was recieved');
        socket.broadcast.emit('media', data)
=======
        socket.broadcast.emit('media', data);
>>>>>>> 9f5edf85b8343c470773ca04fbc06625fc189fd1
    })
});

server.listen(8080);
console.log("server is listening on port 8080");
