var should = require('chai').should(),
    request = require('supertest'),
    config = require('config'),
    express = require('express'),
    mongoose = require('mongoose'),
    uuids = require('../routes/uuids'),
    middleware = require('../lib/middleware'),
    fixtures = require('./fixtures'),
    UUID = require('../models/uuids').UUID,
    UUIDUpdates = require('../models/uuids').UUIDUpdates,
    app = express();

mongoose.connect('mongodb://localhost/uuid_master_unit_test');

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

// TESTS
describe('UUID Functions', function() {

    // Load Fixture Data
    describe('Load Fixture Data', function() {

        before( function(done) {

            // Remove all records from table first just in case
            UUID.remove( function(err) {
                if (err) {
                    throw err;
                }
            });

            UUIDUpdates.remove( function(err) {
                if (err) {
                    throw err;
                }
            });

            fixtures.uuids.forEach( function(uuid) {

                UUID.create({
                    host_name: uuid.host_name,
                    host_uuid: uuid.host_uuid,
                    id: uuid.id,
                    last_request: uuid.last_request,
                    state: uuid.state
                }, function(err, doc) {
                    if (err) {
                        throw err;

                        console.log(doc);
                    }
                });
            });

            done();
        });

        it('Ensure fixture data loaded', function(done) {

            request(app)
            .get('/api/v1/uuids')
            .expect('Content-Type', /application\/json/)
            .expect(200)
            .end( function(err, res) {

                res.body.should.have.property('uuids');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(10);

                done();
            });
        });
    });

    var testhost = new Object;

    describe('POST /api/v1/uuids', function() {

        var body = {
            host_name: 'TEST10.EXAMPLE.COM',
            host_uuid: 'DB578C3D-E248-4228-A306-973DAE9E9C3C'
        };

        it('allows proper uuid request', function(done) {
            request(app)
            .post('/api/v1/uuids')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .send(body)
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuid');
                res.body.uuid.should.have.property('id');
                res.body.uuid.should.have.property('host_name');
                res.body.uuid.should.have.property('host_uuid');
                res.body.uuid.should.have.property('state');
                res.body.uuid.should.have.property('last_request');
                res.body.uuid.should.not.have.property('_id');
                res.body.uuid.should.not.have.property('__v');
                res.body.uuid.host_name.should.not.equal(body.host_name);
                res.body.uuid.host_name.should.equal(body.host_name.toLowerCase());
                res.body.uuid.host_uuid.should.equal(body.host_uuid.toUpperCase());
                res.body.uuid.state.should.equal('PENDING');

                // Assign the test host information to an object for later use
                testhost['id']           = res.body.uuid.id;
                testhost['host_name']    = res.body.uuid.host_name;
                testhost['host_uuid']    = res.body.uuid.host_uuid;
                testhost['state']        = res.body.uuid.state;
                testhost['last_request'] = res.body.uuid.last_request;

                done();
            });
        });

        it('disallows uuid request with missing host_name parameter', function(done) {
            request(app)
            .post('/api/v1/uuids')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .send({ host_uuid: '1234567890' })
            .expect(400)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('You must provide both a host_name and host_uuid.');

                done();
            });
        });

        it('disallows uuid request with missing host_uuid parameter', function(done) {
            request(app)
            .post('/api/v1/uuids')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .send({ host_name: 'test01.example.com' })
            .expect(400)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('You must provide both a host_name and host_uuid.');

                done();
            });
        });
    });

    describe('PUT /api/v1/uuids/:uuid', function() {

        it('allows update of state and normalizes state.toUpperCase()', function(done) {

            var state = 'confirmed';

            request(app)
            .put('/api/v1/uuids/' + testhost.id)
            .set('Content-Type', 'application/json')
            .send({ state: state })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuid');
                res.body.uuid.should.have.property('id');
                res.body.uuid.should.have.property('host_name');
                res.body.uuid.should.have.property('host_uuid');
                res.body.uuid.should.have.property('state');
                res.body.uuid.should.have.property('last_request');
                res.body.uuid.id.should.equal(testhost.id);
                res.body.uuid.host_name.should.equal(testhost.host_name);
                res.body.uuid.host_uuid.should.equal(testhost.host_uuid);
                res.body.uuid.last_request.should.equal(testhost.last_request);
                res.body.uuid.state.should.equal(state.toUpperCase());
                res.body.uuid.state.should.not.equal(state);
                res.body.uuid.state.should.not.equal(testhost.state);

                // Update testhost.state
                testhost.state = res.body.uuid.state;

                done();
            });
        });

        it('allows update of host_name and normalizes host_name.toLowerCase()', function(done) {

            var host_name = 'TEST11.EXAMPLE.COM';

            request(app)
            .put('/api/v1/uuids/' + testhost.id)
            .set('Content-Type', 'application/json')
            .send({ host_name: host_name })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuid');
                res.body.uuid.should.have.property('id');
                res.body.uuid.should.have.property('host_name');
                res.body.uuid.should.have.property('host_uuid');
                res.body.uuid.should.have.property('state');
                res.body.uuid.should.have.property('last_request');
                res.body.uuid.id.should.equal(testhost.id);
                res.body.uuid.host_uuid.should.equal(testhost.host_uuid);
                res.body.uuid.state.should.equal(testhost.state);
                res.body.uuid.last_request.should.equal(testhost.last_request);
                res.body.uuid.host_name.should.equal(host_name.toLowerCase());
                res.body.uuid.host_name.should.not.equal(host_name);
                res.body.uuid.host_name.should.not.equal(testhost.host_name);

                // Update testhost.host_name
                testhost.host_name = res.body.uuid.host_name;

                done();
            });
        });

        it('allows update of host_uuid and normalizes host_uuid.toUpperCase()', function(done) {

            var host_uuid = 'ecf644b1-075b-456b-871e-7918e12Fa55d';

            request(app)
            .put('/api/v1/uuids/' + testhost.id)
            .set('Content-Type', 'application/json')
            .send({ host_uuid: host_uuid })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuid');
                res.body.uuid.should.have.property('id');
                res.body.uuid.should.have.property('host_name');
                res.body.uuid.should.have.property('host_uuid');
                res.body.uuid.should.have.property('state');
                res.body.uuid.should.have.property('last_request');
                res.body.uuid.id.should.equal(testhost.id);
                res.body.uuid.host_name.should.equal(testhost.host_name);
                res.body.uuid.state.should.equal(testhost.state);
                res.body.uuid.last_request.should.equal(testhost.last_request);
                res.body.uuid.host_uuid.should.equal(host_uuid.toUpperCase());
                res.body.uuid.host_uuid.should.not.equal(host_uuid);
                res.body.uuid.host_uuid.should.not.equal(testhost.host_uuid);

                // Update testhost.host_name
                testhost.host_uuid = res.body.uuid.host_uuid;

                done();
            });
        });

        it('disallows update with nothing in body', function(done) {

            request(app)
            .put('/api/v1/uuids/' + testhost.id)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(500)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('json parse failure');

                done();
            });
        });
    });

    describe('GET /api/v1/uuids/:uuid', function() {

        it('returns a list of uuids matching query', function(done) {
            request(app)
            .get('/api/v1/uuids/' + testhost.id)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /application\/json/)
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.not.have.property('_id');
                res.body.uuids[0].should.not.have.property('__v');
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].last_request.should.equal(testhost.last_request);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('accepts parameter host_name and normalizes host_name.toLowerCase()', function(done) {
            request(app)
            .get('/api/v1/uuids/4?host_name=test11')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);

                done();
            });
        });

        it('accepts parameter host_uuid and normalizes host_uuid.toUpperCase()', function(done) {
            request(app)
            .get('/api/v1/uuids/4?host_uuid=' + testhost.host_uuid)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);

                done();
            });
        });

        it('accepts parameter last_request', function(done) {

            request(app)
            .get('/api/v1/uuids/4?last_request=' + testhost.last_request)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].last_request.should.equal(testhost.last_request);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('accepts parameter state and normalizes state.toUpperCase()', function(done) {

            var state = 'pending';

            request(app)
            .get('/api/v1/uuids/4?state=' + state)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.uuids.forEach( function(uuid) {
                    uuid.state.should.not.equal(state);
                    uuid.state.should.equal(state.toUpperCase());
                });
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(10);

                done();
            });
        });

        it('accepts parameter limit', function(done) {

            var limit = 1;

            request(app)
            .get('/api/v1/uuids/4?limit=' + limit)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.count.should.equal(1);
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.meta.pagination.total_count.should.equal(11);
                res.body.meta.pagination.total_pages.should.equal(11);
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);

                done();
            });
        });

        it('accepts parameter page', function(done) {

            var page  = '1';
            var limit = '1';

            request(app)
            .get('/api/v1/uuids/4?limit=' + limit + '&page=' + page)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.count.should.equal(1);
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.meta.pagination.current_page.should.equal(page);
                res.body.meta.pagination.total_count.should.equal(11);
                res.body.meta.pagination.total_pages.should.equal(Math.ceil(res.body.meta.pagination.total_count / limit));

                done();
            });
        });

        it('sort=host_name order=1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=host_name&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=host_name order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=host_name&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].last_request.should.equal(testhost.last_request);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('sort=host_uuid order=1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=host_uuid&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=host_uuid order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=host_uuid&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('sort=state order=1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=state&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('sort=state order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=state&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=last_request order=1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=last_request&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=last_request order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=last_request&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });


        it('returns proper default order if order param is not provided', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=last_request')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });


        it('returns error if order is not valid', function(done) {

            request(app)
            .get('/api/v1/uuids/4?sort=host_uuid&order=2')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('Unknown order paramter: 2. Valid values are 1 or -1');

                done();
            });
        });

        it('returns error if no uuids found', function(done) {

            request(app)
            .get('/api/v1/uuids/4?state=denied')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('No UUID\'s found matching search criteria');

                done();
            });
        });
    });

    describe('GET /api/v1/uuids', function() {

        it('returns a list of uuids matching query', function(done) {
            request(app)
            .get('/api/v1/uuids')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);

                done();
            });
        });

        it('accepts parameter host_name and normalizes host_name.toLowerCase()', function(done) {
            request(app)
            .get('/api/v1/uuids?host_name=' + testhost.host_name.toUpperCase())
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);

                done();
            });
        });

        it('accepts parameter host_uuid and normalizes host_uuid.toUpperCase()', function(done) {

            request(app)
            .get('/api/v1/uuids?host_uuid=' + testhost.host_uuid.toLowerCase())
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].last_request.should.equal(testhost.last_request);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('accepts parameter last_request', function(done) {

            request(app)
            .get('/api/v1/uuids?last_request=' + testhost.last_request)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].last_request.should.equal(testhost.last_request);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('accepts parameter state and normalizes state.toUpperCase()', function(done) {

            var state = 'pending';

            request(app)
            .get('/api/v1/uuids?state=' + state)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.uuids.forEach( function(uuid) {
                    uuid.state.should.not.equal(state);
                    uuid.state.should.equal(state.toUpperCase());
                });
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(10);

                done();
            });
        });

        it('accepts parameter limit', function(done) {

            var limit = 1;

            request(app)
            .get('/api/v1/uuids?limit=' + limit)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.count.should.equal(1);
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.meta.pagination.total_count.should.equal(11);
                res.body.meta.pagination.total_pages.should.equal(11);
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);

                done();
            });
        });

        it('accepts parameter page', function(done) {

            var page  = '1';
            var limit = '1';

            request(app)
            .get('/api/v1/uuids?limit=' + limit + '&page=' + page)
            .set('Content-Type', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(1);
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.count.should.equal(1);
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.meta.pagination.current_page.should.equal(page);
                res.body.meta.pagination.total_count.should.equal(11);
                res.body.meta.pagination.total_pages.should.equal(Math.ceil(res.body.meta.pagination.total_count / limit));

                done();
            });
        });

        it('sort=host_name order=1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=host_name&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=host_name order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=host_name&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].last_request.should.equal(testhost.last_request);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('sort=host_uuid order=1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=host_uuid&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=host_uuid order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=host_uuid&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('sort=state order=1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=state&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });

        it('sort=state order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=state&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=last_request order=1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=last_request&order=1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });

        it('sort=last_request order=-1', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=last_request&order=-1')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal(testhost.host_name);
                res.body.uuids[0].host_uuid.should.equal(testhost.host_uuid);
                res.body.uuids[0].id.should.equal(testhost.id);
                res.body.uuids[0].state.should.equal(testhost.state);

                done();
            });
        });


        it('returns proper default order if order param is not provided', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=last_request')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('uuids');
                res.body.should.have.property('meta');
                res.body.meta.should.have.property('count');
                res.body.meta.should.have.property('pagination');
                res.body.meta.pagination.should.have.property('total_pages');
                res.body.meta.pagination.should.have.property('total_count');
                res.body.meta.pagination.should.have.property('current_page');
                res.body.uuids.should.be.an('array');
                res.body.uuids.should.have.length(11);
                res.body.uuids[0].should.have.property('host_name');
                res.body.uuids[0].should.have.property('host_uuid');
                res.body.uuids[0].should.have.property('id');
                res.body.uuids[0].should.have.property('last_request');
                res.body.uuids[0].should.have.property('state');
                res.body.uuids[0].host_name.should.equal('test00.example.com');
                res.body.uuids[0].host_uuid.should.equal('09467989-F7BB-498A-9918-C0D10A35A5D6');
                res.body.uuids[0].id.should.equal('A866513F-7A95-47EB-885B-9687F3E66E71');
                res.body.uuids[0].state.should.equal('PENDING');

                done();
            });
        });


        it('returns error if order is not valid', function(done) {

            request(app)
            .get('/api/v1/uuids?sort=host_uuid&order=2')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('Unknown order paramter: 2. Valid values are 1 or -1');

                done();
            });
        });

        it('returns error if no uuids found', function(done) {

            request(app)
            .get('/api/v1/uuids?state=denied')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('No UUID\'s found matching search criteria');

                done();
            });
        });
    });

    describe('POST /api/v1/uuids/:uuid/diff', function() {
        it('stores differences between host_name and whats in database and is normalizes host_name.toLowerCase()', function(done) {

            var host_name = 'TEST10.EXAMPLE.COM';

            request(app)
            .post('/api/v1/uuids/' + testhost.id + '/diff')
            .set('Content-Type', 'application/json')
            .send({ host_name: host_name })
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('host_name');
                res.body.should.have.property('last_request');
                res.body.should.have.property('id');
                res.body.host_name.should.equal(host_name.toLowerCase());
                res.body.id.should.equal(testhost.id);

                testhost.host_name = host_name.toLowerCase();

                done();
            });

        });

        it('stores differences between host_uuid and whats in database and normalizes host_uuid.toUpperCase()', function(done) {

            var host_uuid = '161e40a7-25ee-45e8-bba7-77929b1d7a15';

            request(app)
            .post('/api/v1/uuids/' + testhost.id + '/diff')
            .set('Content-Type', 'application/json')
            .send({ host_uuid: host_uuid })
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('host_uuid');
                res.body.should.have.property('last_request');
                res.body.should.have.property('id');
                res.body.host_uuid.should.equal(host_uuid.toUpperCase());
                res.body.id.should.equal(testhost.id);

                testhost.host_uuid = host_uuid.toUpperCase();

                done();
            });

        });

        it('stores differences between both host_uuid and host_name comparted to whats in database and normalizes properly', function(done) {

            var host_uuid = '161e40a7-25ee-45e8-bba7-77929b1d7b15';
            var host_name = 'TEST12.EXAMPLE.COM';

            request(app)
            .post('/api/v1/uuids/' + testhost.id + '/diff')
            .set('Content-Type', 'application/json')
            .send({ host_uuid: host_uuid, host_name: host_name })
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('host_uuid');
                res.body.should.have.property('host_name');
                res.body.should.have.property('last_request');
                res.body.should.have.property('id');
                res.body.host_uuid.should.equal(host_uuid.toUpperCase());
                res.body.host_name.should.equal(host_name.toLowerCase());
                res.body.id.should.equal(testhost.id);

                testhost.host_uuid = host_uuid.toUpperCase();
                testhost.host_name = host_name.toLowerCase();

                done();
            });

        });

        it('returns error if no proper params are passed', function(done) {

            request(app)
            .post('/api/v1/uuids/' + testhost.id + '/diff')
            .set('Content-Type', 'application/json')
            .send({ hostname: 'test13.example.com' })
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('You must provide either a host_uuid or host_name');

                done();
            });
        });

        it('returns error if uuid not found', function(done) {

            request(app)
            .post('/api/v1/uuids/1234/diff')
            .set('Content-Type', 'application/json')
            .send({ host_name: 'test13.example.com' })
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('1234 does not exist');

                done();
            });

        });
    });

    describe('GET /api/v1/uuids/:uuid/diff', function() {

        it('lists pending uuid diff', function(done) {

            request(app)
            .get('/api/v1/uuids/' + testhost.id + '/diff')
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('host_name');
                res.body.should.have.property('host_uuid');
                res.body.should.have.property('last_request');
                res.body.should.have.property('uuid_id');
                res.body.uuid_id.should.equal(testhost.id);
                res.body.host_name.should.equal('test12.example.com');
                res.body.host_uuid.should.equal('161E40A7-25EE-45E8-BBA7-77929B1D7B15');

                done();
            });
        });

        it('returns 400 if no diffs exist', function(done) {

            request(app)
            .get('/api/v1/uuids/A866513F-7A95-47EB-885B-9687F3E66E71/diff')
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('There are currently no diffs for A866513F-7A95-47EB-885B-9687F3E66E71');

                done();
            });
        });

        it('returns 400 if uuid not found', function(done) {

            request(app)
            .get('/api/v1/uuids/1234/diff')
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('1234 does not exist');

                done();
            });
        });

    });

    describe('DELETE /api/v1/uuids/:uuid/diff', function() {

        it('allows deletion of uuid diff', function(done) {

            request(app)
            .del('/api/v1/uuids/' + testhost.id + '/diff')
            .expect(200, done)
        });

        it('returns 400 if uuid not found', function(done) {

            request(app)
            .del('/api/v1/uuids/1234/diff')
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal('1234 does not exist');

                done();
            });

        });
    });

    describe('DELETE /api/v1/uuids/:uuid', function() {

        it('allows deletion on proper request', function(done) {

            request(app)
            .del('/api/v1/uuids/' + testhost.id)
            .expect(200, done)
        });

        it('disallows deletion on inproper request', function(done) {

            request(app)
            .del('/api/v1/uuids/' + testhost.id)
            .expect(400)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .end( function(err, res) {
                if (err) {
                    throw err;
                }

                res.body.should.have.property('message');
                res.body.message.should.equal(testhost.id + ' does not exist');
                done();
            });
        });
    });

    // Unload Fixure Data
    describe('Unload Fixture Data', function() {

        before( function(done) {
            UUID.remove( function(err) {
                if (err) {
                    throw err;
                }
            });

            UUIDUpdates.remove( function(err) {
                if (err) {
                    throw err;
                }
            });

            done();
        });

        it('Ensure Fixture Data Unloaded', function(done) {

            request(app)
            .get('/api/v1/uuids')
            .expect('Content-Type', /application\/json/)
            .expect(400)
            .end( function(err, res) {

                res.body.should.have.property('message');
                res.body.message.should.be.a('string');

                done();
            });
        });
    });
});

