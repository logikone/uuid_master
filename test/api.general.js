var should = require('chai').should(),
    request = require('supertest'),
    app = require('../app');

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

