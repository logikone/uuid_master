var should = require('chai').should(),
    request = require('supertest'),
    express = require('express'),
    uuids = require('../routes/uuids'),
    middleware = require('../lib/middleware'),
    app = express();


//app.use(middleware.checkHeaders);
app.use(express.json({ strict: true }));
app.use(middleware.jsonParseFailure);

// HTTP Routes
app.get('/api/v1/uuids/:uuid', uuids.show);

describe('General App Functions', function() {

    describe('Error Handling', function() {
        it('handles json parse failures gracefully', function() {

            request(app)
            .put('/api/v1/uuids/THISISANINVALIDHOSTUUID')
            .set('Content-Type', 'application/json')
            .send('{malformed:json:string}')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(500)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('json parse failure');
            });
        });
    });
});

