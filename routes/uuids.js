var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    var query = /./;
    if (req.query.hostname) {
        query = req.query.hostname
    }

    UUID.find({ hostname: query }, function(err, docs) {
        if (err) {
            res.json(400, err);
        }
        else {
            res.json(200, docs);
        }
    });
};

exports.create = function(req, res) {

    var newUUID = '';
    
    do {
        newUUID = genUUID();
    
        UUID.find({
            uuid: newUUID
        }, function(err, docs) {
            if (err) {
                res.json(400, err);
            }
            else {
                if (docs === false) {
                    newUUID = false;
                }
            }
        })
    }
    while ( newUUID === false );

    console.log(req.body.hostname);
    UUID.findOne({
        hostname: req.body.hostname
    }, function(err, docs) {
        if (err) {
            res.json(400, err);
        }
        else {
            if(docs == false) {
                UUID.create({
                    hostname: req.body.hostname,
                    uuid: newUUID,
                    state: 'PENDING'
                }, function(err, docs) {
                    if (err) {
                        res.json(400, err);
                    }
                    else {
                        res.json(200, '{ state: PENDING }');
                    }
                })
            }
            else {
                if (docs.state === 'CONFIRMED') {
                    res.json(200, '{ state: CONFIRMED, uuid: ' + docs.uuid + ' }');
                }
                else {
                    res.json(200, '{ state: ' + docs.state + ' }');
                }
            }
        }
    })
};
