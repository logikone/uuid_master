#!/usr/bin/env node

var config = require('config'),
    express = require('express'),
    mongoose = require('mongoose'),
    uuids = require('./routes/uuids'),
    middleware = require('./lib/middleware'),
    cluster = require('cluster'),
    fs = require('fs'),
    net = require('net'),
    http = require('http'),
    https = require('https'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;

    for (var i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker) {

        console.log('Worker ' + worker.id + ' died.');
        cluster.fork();
    });
}
else {
    express.logger.format('custom', config.logging.file.format);

    if (config.logging.file.enabled) {
        logpath = config.logging.file.path;
        logfile = fs.createWriteStream(logpath, { flags: 'a' });
        app.use(express.logger({ format: 'custom', stream: logfile }));
    }
    else {
        app.use(express.logger({ format: 'custom' }));
    }

    if (config.logging.elasticsearch) {
        app.use(express.logger( function(tokens, req, res) {

            // bits to log
            var request_url = tokens.url(req),
                request_method = tokens.method(req),
                request_host = tokens.req(req, res, 'host'),
                response_time = tokens['response-time'](req),
                date = tokens.date(req),
                status_code = tokens.status(req, res),
                referrer = tokens.referrer(req),
                remote_address = tokens['remote-addr'](req),
                http_version = tokens['http-version'](req),
                user_agent = tokens['user-agent'](req);

            var es_logline = {
                request_url: request_url,
                request_host: request_host,
                request_method: request_method,
                response_time: response_time,
                date: date,
                status_code: status_code,
                referrer: referrer,
                remote_address: remote_address,
                http_version: http_version,
                user_agent: user_agent
            };

            var tags = new Array;

            for ( i = 0; i < config.logging.elasticsearch.tags.length; i++ ) {
                tags.push(config.logging.elasticsearch.tags[i]);
            }

            es_logline.tags = tags;

            var es_host = config.logging.elasticsearch.host,
                es_port = config.logging.elasticsearch.port;

            var tcp = net.connect({ host: es_host, port: es_port }, function() {
                tcp.write(JSON.stringify(es_logline));
            });

            tcp.on('error', function(err) {
                console.log('ERROR connecting to ' + es_host + ':' + es_port + '. REASON: ' + err.code ); 
            });
        }));
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
    //app.use(middleware.checkHeaders);
    app.use(express.json({ strict: true }));
    app.use(middleware.jsonParseFailure);

    // HTTP Routes
    app.get('/api/v1/uuids', uuids.index);
    app.get('/api/v1/uuids/:uuid', uuids.show);
    app.post('/api/v1/uuids', uuids.create);
    app.put('/api/v1/uuids/:uuid', uuids.update);
    app.delete('/api/v1/uuids/:uuid', uuids.destroy);

    app.post('/api/v1/uuids/:uuid/update', uuids.createUpdate);
    app.put('/api/v1/uuids/:uuid/update', uuids.updateUpdate);

    if (config.server.http_enabled) {
        var http_server = http.createServer(app).listen(config.server.http_port);

        http_server.on('error', function(err) {
            console.log(err);
        })
    }
    if (config.server.https_enabled) {
        var https_options = {
            key: fs.readFileSync(config.server.ssl_key),
            cert: fs.readFileSync(config.server.ssl_certificate)
        };

        var https_server = https.createServer(https_options, app).listen(config.server.https_port);

        https_server.on('error', function(err) {
            console.log(err);
        })
    }
}
