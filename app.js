var config = require('config'),
    express = require('express'),
    resource = require('express-resource'),
    mongoose = require('mongoose'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);

app.configure( function() {
    app.use(express.logger());
    app.use(express.compress());
    app.use(express.json({ strict: true }));
    app.use(express.urlencoded());
});

app.resource('api/uuids', require('./routes/uuids'));

app.listen(3000);
