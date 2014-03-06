var config = require('config'),
    express = require('express'),
    mongoose = require('mongoose'),
    uuids = require('./routes/uuids'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);

app.configure( function() {
    app.use(express.logger());
    app.use(express.compress());
    app.use(express.json({ strict: true }));
});

// HTTP Routes
app.use('/', express.static(__dirname + '/public'));
app.get('/api/v1/uuids', uuids.index);
app.get('/api/v1/uuids/:uuid', uuids.show);
app.post('/api/v1/uuids', uuids.create);
app.put('/api/v1/uuids/:uuid', uuids.update);
app.delete('/api/v1/uuids/:uuid', uuids.destroy);

app.listen(3000);
