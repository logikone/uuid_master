var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    var query = /./;
    if (req.query.hostname) {
        query = req.query.hostname
    }

    UUID.find({ hostname: query }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            res.jsonp(200, docs);
        }
    });
};

exports.show = function(req, res) {

    UUID.findOne({ uuid: req.params.uuid }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            res.jsonp(200, docs);
        }
    });
};

exports.create = function(req, res) {

    if ( ! req.body.hostname ) {
        res.jsonp(400, { message: 'You must provide a hostname.' } );
        return;
    }

    var newUUID = '';
    
    do {
        newUUID = genUUID();
    
        UUID.find({
            uuid: newUUID
        }, function(err, docs) {
            if (err) {
                res.jsonp(400, err);
            }
            else {
                if (docs === false) {
                    newUUID = false;
                }
            }
        })
    }
    while ( newUUID === false );

    UUID.findOne({
        hostname: req.body.hostname
    }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            if(!docs) {
                UUID.create({
                    hostname: req.body.hostname,
                    uuid: newUUID,
                    state: 'PENDING'
                }, function(err, docs) {
                    if (err) {
                        res.jsonp(400, err);
                    }
                    else {
                        res.jsonp(200, { state: docs.state });
                    }
                })
            }
            else {
                if (docs.state === 'CONFIRMED') {
                    res.jsonp(200, { state: docs.state, uuid: docs.uuid });
                }
                else {
                    res.jsonp(200, { state: docs.state });
                }
            }
        }
    })
};

exports.destroy = function(req, res) {

    UUID.remove({ uuid: req.params.uuid }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            res.jsonp(200, docs);
        }
    });
};
