var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req) {

    // Set some defaults
    var hostname = /./;
    var hostuuid = /./;
    var state    = /./;
    var page     = 1;
    var limit    = 0;


    // Override defaults if params are provided
    if (req.data) {
        if (req.data.hostname) {
            hostname = new RegExp(req.data.hostname.toLowerCase());
        }
        if (req.data.state) {
            state = new RegExp(req.data.state.toUpperCase());
        }
        if (req.data.page) {
            page = req.data.page
        }

        if (req.data.limit) {
            limit = req.data.limit
        }
    }
    if (req.query) {
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
    }

    // Set number of docs to skip based off current page
    var skip = limit * (page - 1);

    UUID.find({ host_name: hostname, state: state, host_uuid: hostuuid }, '-_id -__v', { skip: skip, limit: limit }, function(err, docs) {
        if (err) {
            req.io.respond({ status: 'ERROR', message: err });
        }
        else {
            UUID.count({ host_name: hostname, state: state, host_uuid: hostuuid }).count( function(err, count) {

                var total_pages = Math.round(count / limit);
                if (total_pages === Infinity) {
                    total_pages = 1
                }

                var response = {
                    uuids: docs,
                    meta: {
                        count: docs.length,
                        pagination: {
                            total_pages: total_pages,
                            current_page: page,
                            total_count: count
                        }
                    }
                }

                req.io.respond(response);
            });
        }
    });
};

exports.show = function(req) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.findOne({ id: masterUUID }, '-_id -__v', function(err, docs) {
        if (err) {
            req.io.respond({ status: 'ERROR', message: err });
        }
        else {
            req.io.respond({ 'uuid': docs });
        }
    });
};

exports.create = function(req) {

    if ( ! req.body.host_name || ! req.body.host_uuid ) {
        req.io.respond({ message: 'You must provide both a host_name and host_uuid.' } );
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
                req.io.respond({ status: 'ERROR', message: err });
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
            req.io.respond(err);
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
                        req.io.respond({ status: 'ERROR', message: err });
                    }
                    else if (!docs) {
                        req.io.respond({ status: 'ERROR', message: 'Something went wrong, UUID request did not get stored in database' });
                    }
                    else {
                        req.io.respond({ status: 'OK', state: docs.state });
                    }
                })
            }
            else {
                if (docs.state === 'CONFIRMED') {
                    UUID.update({ id: docs.id }, { last_request: now }, function(err, doc) {
                        if (err) {
                            req.io.respond({ status: 'ERROR', message: err });
                        }
                        else {
                            req.io.respond({ status: 'OK', state: docs.state, uuid: docs.id });
                        }
                    });
                }
                else {
                    UUID.update({ id: docs.id }, { last_request: now }, function(err, doc) {
                        if (err) {
                            req.io.respond({ status: 'ERROR', message: err });
                        }
                        else {
                            req.io.respond({ status: 'OK', state: docs.state });
                        }
                    });
                }
            }
        }
    })
};

exports.update = function(req) {

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
                req.io.respond({ status: 'ERROR', message: err });
            }
            else if (!docs) {
                req.io.respond({ status: 'ERROR', message: 'Something went wrong, UUID request did not get stored in database' });
            }
            else {
                UUID.remove({ id: delUUID },
                    function(err, docs) {
                        if (err) {
                            req.io.respond({ status: 'ERROR', message: err });
                        }
                        else {
                            req.io.respond({ status: 'OK', message: masterUUID + ' updated. ' + delUUID + ' deleted.' });
                        }
                    }
                );
            }
        }
    )
};

exports.edit = function(req) {

    if (!req.query.state) {
        req.io.respond({ status: 'ERROR', message: 'Must specify target state' });
        return;
    }

    var state        = req.query.state.toUpperCase();
    var masterUUID   = req.params.uuid.toUpperCase();

    if (!/^(CONFIRMED|DENIED)$/.test(state)) {
        req.io.respond({ status: 'ERROR', message: 'Unknown state: ' + state + '. Must be one of (CONFIRMED|DENIED)'});
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
                req.io.respond({ status: 'ERROR', message: err });
            }
            else if (!docs) {
                req.io.respond({ status: 'ERROR', message: 'UUID not found' });
            }
            else {
                req.io.respond({ status: 'OK', uuid: masterUUID, message: 'State is now ' + state });
                req.io.broadcast('uuids:index', { status: 'OK', uuid: masterUUID, message: 'State is now ' + state });
            }
        }
    );
};

exports.destroy = function(req) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.remove({ id: masterUUID }, function(err, docs) {
        if (err) {
            req.io.respond(err);
        }
        else {
            if (!docs) {
                req.io.respond({ status: 'ERROR', messagge: masterUUID + ' does not exist' });
            }
            else {
                req.io.respond({ status: 'OK', message: masterUUID + ' deleted' });
            }
        }
    });
};
