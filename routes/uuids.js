var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    var query = /./;
    if (req.query.host_name) {
        query = req.query.host_name
    }

    UUID.find({ host_name: query }, function(err, docs) {
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

    if ( ! req.body.host_name || ! req.body.host_uuid ) {
        res.jsonp(400, { message: 'You must provide both a host_name and host_uuid.' } );
        return;
    }

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
        host_name: req.body.host_name,
        host_uuid: req.body.host_uuid
    }, function(err, docs) {
        if (err) {
            res.jsonp(400, err);
        }
        else {
            if (!docs) {
                UUID.create({
                    host_name: req.body.host_name,
                    host_uuid: req.body.host_uuid,
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

    //UUID.update(
    //    {
    //        uuid: req.params.uuid.toUpperCase()
    //    },
    //    {
    //        host_name: req.body.host_name,
    //        host_uuid: req.body.host_uuid
    //    },
    //    function(err, docs) {
    //        if (err) {
    //            res.jsonp({ status: 'ERROR', message: err });
    //        }
    //        else if (!docs) {
    //            res.jsonp(400, { status: 'ERROR', message: 'Something went wrong, UUID request did not get stored in database' });
    //        }
    //        else {
    //            UUID.remove({ uuid: req.body.old_uuid.toUpperCase() },
    //                function(err, docs) {
    //                }
    //            );
    //        }
    //    }
    //)
    
    res.jsonp({ status: 'OK' });
};

exports.edit = function(req, res) {

    if (!req.query.state) {
        res.jsonp(400, { status: 'ERROR', message: 'Must specify target state' });
        return;
    }

    var state = req.query.state.toUpperCase();

    if (!/^(CONFIRMED|DENIED)$/.test(state)) {
        res.jsonp(400, { status: 'ERROR', message: 'Unknown state: ' + state + '. Must be one of (CONFIRMED|DENIED)'});
        return;
    }

    UUID.update(
        {
            uuid: req.params.uuid.toUpperCase()
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
                res.jsonp({ status: 'OK', uuid: req.params.uuid.toUpperCase(), message: 'State is now ' + state });
            }
        }
    );
};

exports.destroy = function(req, res) {

    UUID.remove({ uuid: req.params.uuid.toUpperCase() }, function(err, docs) {
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
