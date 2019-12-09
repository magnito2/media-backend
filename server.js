const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 4000;
const cors = require('cors');
const passport = require('passport');
const socketIo = require('socket.io');
const http = require('http');

const users = require("./routes/users");

const mongoose = require('mongoose');
const config = require('./config/keys');


mongoose.Promise = global.Promise;
mongoose.connect(config.DB, { useNewUrlParser: true }).then(
    () => {console.log('Database is connected') },
    err => { console.log('Can not connect to the database'+ err)}
);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passport")(passport);

//lets make a socketio server
const server = http.createServer(app);
const io = socketIo(server);
io.on("connection", socket => {
    console.log("we have a new client connected");


    socket.on("getRouterRtpCapabilities", () =>{ 
       console.log("Recieved event, get router rtp capabilities");
	socket.emit("outgoing data");

    });

    socket.on("disconnect", ()=> console.log("client disconnected"));
});

// Routes
app.use("/api/users", users);

server.listen(PORT, function(){
    console.log('Server is running on Port:',PORT);
});
