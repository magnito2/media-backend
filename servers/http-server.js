'use strict';

const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');

const users = require("../routes/users");
const config = require('../config/config');

mongoose.Promise = global.Promise;
mongoose.connect(config.database.DB, { useNewUrlParser: true }).then(
    () => {console.log('Database is connected') },
    err => { console.log('Can not connect to the database'+ err)}
);

module.exports = function(app) {

    app.use(cors());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    // Passport middleware
    app.use(passport.initialize());
    // Passport config
    require("../config/passport")(passport);


    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    // Routes
    app.use("/api/users", users);

    app.get('/', (req, res) => {
        res.json({message: 'Yey, we are here'});
    });

    return app;
};
//module.exports = app;