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

    //sends the event(broadcasting) it to everyone
    //except the origin
    socket.on('mousemove', function(data) {
        socket.broadcast.emit('moving', data);
    });
});

server.listen(8080);
console.log("server is listening on port 8080");
