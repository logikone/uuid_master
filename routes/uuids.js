var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    // Set some defaults
    var hostname = /./;
    var hostuuid = /./;
    var state    = /./;
    var page     = 1;
    var limit    = 0;

    // Override defaults if params are provided
    if (req.query.hostname) {
        hostname = new RegExp(req.query.hostname.toLowerCase());
    }
    if (req.query.state) {
        state = new RegExp(req.query.state.toUpperCase());
    }
    if (req.query.page) {
        page = req.query.page
    }
    if (req.query.limit) {
        limit = req.query.limit
    }

    // Set number of docs to skip based off current page
    var skip = limit * (page - 1);

    UUID.find({ host_name: hostname, state: state, host_uuid: hostuuid }, '-_id -__v', { skip: skip, limit: limit }, function(err, docs) {
        if (err) {
            res.jsonp(400, { status: 'ERROR', message: err });
        }
        else {
            UUID.count({ host_name: hostname, state: state, host_uuid: hostuuid }).count( function(err, count) {

                var total_pages = Math.round(count / limit);
                if (total_pages === Infinity) {
                    total_pages = 1
                }

                res.jsonp(200, {
                    uuids: docs,
                    meta: {
                        count: docs.length,
                        pagination: {
                            total_pages: total_pages,
                            current_page: page,
                            total_count: count
                        }
                    }
                });
            });
        }
    });
};

exports.show = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.findOne({ id: masterUUID }, '-_id -__v', function(err, docs) {
        if (err) {
            res.jsonp(400, { status: 'ERROR', message: err });
        }
        else {
            res.jsonp(200, { 'uuid': docs });
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
    var newUUID  = '';
    var now      = new Date();

    do {
        newUUID = genUUID().toUpperCase();
    
        UUID.find({
            id: newUUID
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
                    id: newUUID,
                    last_request: now,
                    state: 'PENDING'
                }, function(err, docs) {
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
                    UUID.update({ id: docs.id }, { last_request: now }, function(err, doc) {
                        if (err) {
                            res.json(400, { status: 'ERROR', message: err });
                        }
                        else {
                            res.jsonp(200, { status: 'OK', state: docs.state, uuid: docs.id });
                        }
                    });
                }
                else {
                    UUID.update({ id: docs.id }, { last_request: now }, function(err, doc) {
                        if (err) {
                            res.json(400, { status: 'ERROR', message: err });
                        }
                        else {
                            res.jsonp(200, { status: 'OK', state: docs.state });
                        }
                    });
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
            id: masterUUID
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
                UUID.remove({ id: delUUID },
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
            id: masterUUID
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

    UUID.remove({ id: masterUUID }, function(err, docs) {
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
