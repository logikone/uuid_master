var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;

exports.index = function(req, res) {

    // Set some defaults
    var hostname = /./;
    var hostuuid = /./;
    var state    = /./;
    var page     = 1;
    var limit    = 0;

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
            res.json(400, { message: err });
        }
        else {
            UUID.count({ host_name: hostname, state: state, host_uuid: hostuuid }).count( function(err, count) {

                var total_pages = Math.ceil(count / limit);
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

                res.json(200, response);
            });
        }
    });
};

exports.show = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.findOne({ id: masterUUID }, '-_id -__v', function(err, doc) {
        if (err) {
            res.json(400, { message: err });
        }
        else if (!doc) {
            res.json(400, { message: masterUUID + ' not found.' });
        }
        else {
            res.json(200, { uuid: doc });
        }
    });
};

exports.create = function(req, res) {

    if ( ! req.body.host_name || ! req.body.host_uuid ) {
        res.json(400, { message: 'You must provide both a host_name and host_uuid.' } );
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
                res.json(400, { message: err });
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
    }, function(err, doc) {
        if (err) {
            res.json(400, { message: err });
        }
        else {
            if (!doc) {
                UUID.create({
                    host_name: hostName,
                    host_uuid: hostUUID,
                    id: newUUID,
                    last_request: now,
                    state: 'PENDING'
                }, function(err, doc) {
                    if (err) {
                        res.json(400, { message: err });
                    }
                    else if (!doc) {
                        res.json(400, { message: 'Something went wrong, UUID request did not get stored in database' });
                    }
                    else {
                        res.json(200,
                            {
                                uuid: {
                                    id: doc.id,
                                    host_name: doc.host_name,
                                    host_uuid: doc.host_uuid,
                                    state: doc.state,
                                    last_request: doc.last_request
                                }
                            }
                        );
                    }
                })
            }
            else {
                if (doc.state === 'CONFIRMED') {
                    UUID.findOneAndUpdate({ id: doc.id }, { last_request: now }, { new: true, select: '-_id -__v' }, function(err, doc) {
                        if (err) {
                            res.json(400, { message: err });
                        }
                        else {
                            res.json(200, { uuid: doc });
                        }
                    });
                }
                else {
                    UUID.findOneAndUpdate({ id: doc.id }, { last_request: now }, { new: true, select: '-_id -__v' }, function(err, doc) {
                        if (err) {
                            res.json(400, { message: err });
                        }
                        else {
                            res.json(200, { uuid: doc });
                        }
                    });
                }
            }
        }
    })
};

exports.update = function(req, res) {

    // Create update object and populate as needed
    var updateObj = new Object;

    var masterUUID = req.params.uuid.toUpperCase();
    if (req.body.host_uuid) {
        updateObj['host_uuid'] = req.body.host_uuid.toUpperCase();
    }
    if (req.body.host_name) {
        updateObj['host_name'] = req.body.host_name.toLowerCase();
    }
    if (req.body.state) {
        updateObj['state'] = req.body.state.toUpperCase();
    }

    if (updateObj.state) {
        if (!/^(CONFIRMED|DENIED)$/.test(updateObj.state)) {
            res.json(400, { message: 'Unknown state: ' + updateObj.state + '. Must be one of (CONFIRMED|DENIED)'});
            return;
        }
    }

    UUID.findOneAndUpdate({
        id: masterUUID
    }, updateObj, { new: true, select: '-_id -__v' }, function(err, doc) {
        if (err) {
            res.json(400, { message: err });
        }
        else {
            if (!doc) {
                res.json(400, { message: 'Something went wrong. Database query returned no document.' });
            }
            else {
                res.json(200, { uuid: doc });
            }
        }
    });
};

exports.destroy = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.remove({ id: masterUUID }, function(err, doc) {
        if (err) {
            res.json(400, { message: err });
        }
        else {
            if (!doc) {
                res.json(400, { messagge: masterUUID + ' does not exist' });
            }
            else {
                res.json(200);
            }
        }
    });
};
