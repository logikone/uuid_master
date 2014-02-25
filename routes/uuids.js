var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    var query = /./;
    if (req.query.hostname) {
        query = req.query.hostname
    }

    UUID.find({ hostname: query }, function(err, docs) {
        if (err) {
            res.jsonp(400, { status: 'ERROR', message: err });
        }
        else {
            res.jsonp(200, docs);
        }
    });
};

exports.show = function(req, res) {

    UUID.findOne({ uuid: req.params.uuid }, function(err, docs) {
        if (err) {
            res.jsonp(400, { status: 'ERROR', message: err });
        }
        else {
            res.jsonp(200, { status: 'OK', uuid: docs.uuid });
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
                res.jsonp(400, { status: 'ERROR', message: err });
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
            if (!docs) {
                UUID.create({
                    hostname: req.body.hostname,
                    uuid: newUUID,
                    state: 'PENDING'
                }, function(err, docs) {
                    if (err) {
                        res.jsonp(400, { status: 'ERROR', message: err });
                    }
                    else {
                        res.jsonp(200, { status: 'OK', state: docs.state });
                    }
                })
            }
            else {
                if (docs.state === 'CONFIRMED') {
                    res.jsonp(200, { status: 'OK', state: docs.state, uuid: docs.uuid });
                }
                else {
                    res.jsonp(200, { status: 'OK', state: docs.state });
                }
            }
        }
    })
};

exports.update = function(req, res) {

    if (!req.params.uuid) {
        res.jsonp(400, { status: 'ERROR', message: 'Must specify UUID' });
    }

    var state = req.body.state.toUpperCase();

    console.log(state);
    if (!/CONFIRMED|DENIED/.test(state)) {
        res.jsonp(400, { status: 'ERROR', message: 'Unknown state: ' + state + '. Must be one of (CONFIRMED|DENIED)'});
        return;
    }

    UUID.update(
        {
            uuid: req.params.uuid
        },
        {
            state: state
        },
        function (err, docs) {
            if (err) {
                res.jsonp({ status: 'ERROR', message: err });
            }
            else {
                res.jsonp({ status: 'OK', message: 'Stats is now ' + state });
            }
        }
    );
};

exports.destroy = function(req, res) {

    UUID.remove({ uuid: req.params.uuid }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            if (!docs) {
                res.jsonp(400, { status: 'ERROR', messagge: req.params.uuid + ' does not exist' });
            }
            else {
                res.jsonp(200, { status: 'OK', message: req.params.uuid + ' deleted' });
            }
        }
    });
};
