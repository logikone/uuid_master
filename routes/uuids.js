var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    var query = /./;
    if (req.query.hostname) {
        query = new RegExp(req.query.hostname.toLowerCase());
    }

    UUID.find({ host_name: query }, '-_id -__v', function(err, docs) {
        if (err) {
            res.jsonp(400, { status: 'ERROR', message: err });
        }
        else {
            res.jsonp(200, docs);
        }
    });
};

exports.show = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.findOne({ uuid: masterUUID }, function(err, docs) {
        if (err) {
            res.jsonp(400, { status: 'ERROR', message: err });
        }
        else {
            res.jsonp(200, { status: 'OK', uuid: docs.uuid });
        }
    });
};

exports.create = function(req, res) {

    if ( ! req.body.host_name || ! req.body.host_uuid ) {
        res.jsonp(400, { message: 'You must provide both a host_name and host_uuid.' } );
        return;
    }

    var hostName = req.body.host_name.toLowerCase();
    var hostUUID = req.body.host_uuid.toUpperCase();
    var newUUID = '';
    
    do {
        newUUID = genUUID().toUpperCase();
    
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
        host_name: hostName,
        host_uuid: hostUUID
    }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            if (!docs) {
                UUID.create({
                    host_name: hostName,
                    host_uuid: hostUUID,
                    uuid: newUUID,
                    state: 'PENDING'
                }, function(err, docs) {
                    console.log(docs);
                    if (err) {
                        res.jsonp(400, { status: 'ERROR', message: err });
                    }
                    else if (!docs) {
                        res.jsonp(400, { status: 'ERROR', message: 'Something went wrong, UUID request did not get stored in database' });
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

    var masterUUID = req.params.uuid.toUpperCase();
    var hostUUID   = req.body.host_uuid.toUpperCase();
    var hostName   = req.body.host_name.toLowerCase();
    var delUUID    = req.body.del_uuid.toUpperCase();

    UUID.update(
        {
            uuid: masterUUID
        },
        {
            host_name: hostName,
            host_uuid: hostUUID
        },
        function(err, docs) {
            if (err) {
                res.jsonp({ status: 'ERROR', message: err });
            }
            else if (!docs) {
                res.jsonp(400, { status: 'ERROR', message: 'Something went wrong, UUID request did not get stored in database' });
            }
            else {
                UUID.remove({ uuid: delUUID },
                    function(err, docs) {
                        if (err) {
                            res.jsonp(400, { status: 'ERROR', message: err });
                        }
                        else {
                            res.jsonp(200, { status: 'OK', message: masterUUID + ' updated. ' + delUUID + ' deleted.' });
                        }
                    }
                );
            }
        }
    )
};

exports.edit = function(req, res) {

    if (!req.query.state) {
        res.jsonp(400, { status: 'ERROR', message: 'Must specify target state' });
        return;
    }

    var state        = req.query.state.toUpperCase();
    var masterUUID   = req.params.uuid.toUpperCase();

    if (!/^(CONFIRMED|DENIED)$/.test(state)) {
        res.jsonp(400, { status: 'ERROR', message: 'Unknown state: ' + state + '. Must be one of (CONFIRMED|DENIED)'});
        return;
    }

    UUID.update(
        {
            uuid: masterUUID
        },
        {
            state: state
        },
        function (err, docs) {
            if (err) {
                res.jsonp({ status: 'ERROR', message: err });
            }
            else if (!docs) {
                res.jsonp({ status: 'ERROR', message: 'UUID not found' });
            }
            else {
                res.jsonp({ status: 'OK', uuid: masterUUID, message: 'State is now ' + state });
            }
        }
    );
};

exports.destroy = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.remove({ uuid: masterUUID }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            if (!docs) {
                res.jsonp(400, { status: 'ERROR', messagge: masterUUID + ' does not exist' });
            }
            else {
                res.jsonp(200, { status: 'OK', message: masterUUID + ' deleted' });
            }
        }
    });
};
