var config = require('config'),
    express = require('express'),
    mongoose = require('mongoose'),
    uuids = require('./routes/uuids'),
    middleware = require('./lib/middleware'),
    app = express();

mongoose.connect('mongodb://' + config.mongodb.host + '/' + config.mongodb.database);

app.use(express.logger({ immediate: true, format: 'dev' }));
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

app.listen(3000);
