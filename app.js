var config = require('config'),
    express = require('express'),
    mongoose = require('mongoose'),
    uuids = require('./routes/uuids'),
    middleware = require('./lib/middleware'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);
express.logger.format('custom', config.logging.file.format);

if (config.logging.file.enabled) {
    logpath = config.logging.file.path;
    logfile = fs.createWriteStream(logpath, { flags: 'a' });
    app.use(express.logger({ format: 'custom', stream: logfile }));
}
else {
    app.use(express.logger({ format: 'custom' }));
}

// Error Logging
app.use( function(err, req, res, next) {
    console.log(err);
});

// Redirect to https if enabled
if (config.server.http_to_https) {
    app.use( function(req, res, next) {
        if (!req.secure) {
            res.redirect(301, 'https://' + req.host + ':' + config.server.https_port + req.originalUrl);
        }
        else {
            next();
        }
    });
}

app.use(express.compress());
app.use(express.json({ strict: true }));
app.use(middleware.jsonParseFailure);

// HTTP Routes
app.get('/api/v1/uuids', uuids.index);
app.get('/api/v1/uuids/:uuid', uuids.show);
app.post('/api/v1/uuids', uuids.create);
app.put('/api/v1/uuids/:uuid', uuids.update);
app.delete('/api/v1/uuids/:uuid', uuids.destroy);

app.get('/api/v1/uuids/:uuid/diff', uuids.indexDiff);
app.post('/api/v1/uuids/:uuid/diff', uuids.createDiff);
app.delete('/api/v1/uuids/:uuid/diff', uuids.destroyDiff);

module.exports = app;
