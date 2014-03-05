var config = require('config'),
    express = require('express.io'),
    mongoose = require('mongoose'),
    uuids = require('./routes/uuids'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);

app.http().io()
app.configure( function() {
    app.use(express.logger());
    app.use(express.compress());
    app.use(express.json({ strict: true }));
    app.use(express.urlencoded());
});

// Socket.io Routes
app.io.route('uuids', {
    index: uuids.index,
    show: uuids.show,
    create: uuids.create,
    update: uuids.update,
    edit: uuids.edit,
    destroy: uuids.destroy
});

// HTTP Routes
app.use('/', express.static(__dirname + '/public'));
app.get('/api/v1/uuids', function(req, res) { req.io.route('uuids:index') });
app.get('/api/v1/uuids/:uuid', function(req, res) { req.io.route('uuids:show') });
app.post('/api/v1/uuids', function(req, res) { req.io.route('uuids:create') });
app.put('/api/v1/uuids/:uuid', function(req, res) { req.io.route('uuids:update') });
app.get('/api/v1/uuids/:uuid/edit', function(req, res) { req.io.route('uuids:edit') });
app.delete('/api/v1/uuids/:uuid', function(req, res) { req.io.route('uuids:destroy') });

app.get('/api/routes', function(req, res) {
    res.json(200, { routes: app.routes } );
});

app.listen(3000);
