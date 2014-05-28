var genUUID = require('../lib/uuid');
var UUID = require('../models/uuids').UUID;
var UUIDDiffs = require('../models/uuids').UUIDDiffs;

exports.index = function(req, res) {

    // Build query object
    var query = {};

    if (req.query.host_name) {
        query.host_name = new RegExp(req.query.host_name.toLowerCase());
    }
    if (req.query.state) {
        query.state = new RegExp(req.query.state.toUpperCase());
    }
    if (req.query.last_request) {
        query.last_request = req.query.last_request;
    }
    if (req.query.host_uuid) {
        query.host_uuid = new RegExp(req.query.host_uuid.toUpperCase());
    }

    // Set some defaults
    var page     = 1;
    var limit    = 0;
    var order    = '1';

    if (req.query.page) {
        page = req.query.page;
    }
    if (req.query.limit) {
        limit = req.query.limit;
    }
    if (req.query.order) {
        order = req.query.order;
    }

    // Set number of docs to skip based off current page
    var skip = limit * (page - 1);

    var query_options = {
        skip: skip,
        limit: limit
    };

    if (req.query.sort) {
        if ( order === '1' ) {
            query_options.sort = req.query.sort;
        }
        else if ( order === '-1' ) {
            query_options.sort = '-' + req.query.sort;
        }
        else {
            res.json(400, { message: "Unknown order paramter: " + order + ". Valid values are 1 or -1" });
        }
    }

    UUID.find(query, '-__v', query_options, function(err, docs) {
        if (err) {
            res.json(400, { message: err });
        }
        else if (docs.length === 0) {
            res.json(400, { message: "No UUID's found matching search criteria" });
        }
        else {
            UUID.count(query).count( function(err, count) {

                var total_pages = Math.ceil(count / limit);
                if (total_pages === Infinity) {
                    total_pages = 1;
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
                };

                res.json(200, response);
            });
        }
    });
};

exports.show = function(req, res) {

    // Build query object
    var query = {};

    query._id = new RegExp(req.params.uuid.toUpperCase());

    if (req.query.host_name) {
        query.host_name = new RegExp(req.query.host_name.toLowerCase());
    }
    if (req.query.host_uuid) {
        query.host_uuid = new RegExp(req.query.host_uuid.toUpperCase());
    }
    if (req.query.state) {
        query.state = new RegExp(req.query.state.toUpperCase());
    }
    if (req.query.last_request) {
        query.last_request = req.query.last_request;
    }

    // Set some defaults
    var page     = 1;
    var limit    = 0;
    var order    = '1';

    if (req.query.page) {
        page = req.query.page;
    }
    if (req.query.limit) {
        limit = req.query.limit;
    }
    if (req.query.order) {
        order = req.query.order;
    }

    // Set number of docs to skip based off current page
    var skip = limit * (page - 1);

    var query_options = {
        skip: skip,
        limit: limit
    };

    if (req.query.sort) {
        if ( order === '1' ) {
            query_options.sort = req.query.sort;
        }
        else if ( order === '-1' ) {
            query_options.sort = '-' + req.query.sort;
        }
        else {
            res.json(400, { message: "Unknown order paramter: " + order + ". Valid values are 1 or -1" });
        }
    }

    UUID.find(query, '-__v', query_options, function(err, docs) {
        if (err) {
            res.json(400, { message: err });
        }
        else if (docs.length === 0) {
            res.json(400, { message: "No UUID's found matching search criteria" });
        }
        else {

            UUID.count(query).count( function(err, count) {

                var total_pages = Math.ceil(count / limit);
                if (total_pages === Infinity) {
                    total_pages = 1;
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
                };

                res.json(200, response);
            });
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

    // TODO find way to ensure uniqueness of id field
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
                                    _id: doc._id,
                                    host_name: doc.host_name,
                                    host_uuid: doc.host_uuid,
                                    state: doc.state,
                                    last_request: doc.last_request
                                }
                            }
                        );
                    }
                });
            }
            else {
                if (doc.state === 'CONFIRMED') {
                    UUID.findOneAndUpdate({ _id: doc._id }, { last_request: now }, { new: true, select: '-__v' }, function(err, doc) {
                        if (err) {
                            res.json(400, { message: err });
                        }
                        else {
                            res.json(200, { uuid: doc });
                        }
                    });
                }
                else {
                    UUID.findOneAndUpdate({ _id: doc._id }, { last_request: now }, { new: true, select: '-__v' }, function(err, doc) {
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
    });
};

exports.update = function(req, res) {

    // Create update object and populate as needed
    var updateObj = {};

    var masterUUID = req.params.uuid.toUpperCase();
    if (req.body.host_uuid) {
        updateObj.host_uuid = req.body.host_uuid.toUpperCase();
    }
    if (req.body.host_name) {
        updateObj.host_name = req.body.host_name.toLowerCase();
    }
    if (req.body.state) {
        updateObj.state = req.body.state.toUpperCase();
    }

    if (updateObj.state) {
        if (!/^(CONFIRMED|DENIED)$/.test(updateObj.state)) {
            res.json(400, { message: 'Unknown state: ' + updateObj.state + '. Must be one of (CONFIRMED|DENIED)'});
            return;
        }
    }

    UUID.findOneAndUpdate({
        _id: masterUUID
    }, updateObj, { new: true, select: '-__v' }, function(err, doc) {
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

    UUID.remove({ _id: masterUUID }, function(err, doc) {
        if (err) {
            res.json(400, { message: err });
        }
        else {
            if (!doc) {
                res.json(400, { message: masterUUID + ' does not exist' });
            }
            else {
                res.json(200);
            }
        }
    });
};

exports.indexDiff = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase();

    UUID.findOne({ _id: masterUUID }, function(err, doc) {
        if (err) {
            res.json(400, err);
        }
        else if (!doc) {
            res.json(400, { message: masterUUID + ' does not exist' });
        }
        else {
            UUIDDiffs.findOne({ uuid_id: masterUUID }, '-__v', function(err, doc) {
                if (err) {
                    res.json(400, err);
                }
                else {
                    if (!doc) {
                        res.json(400, { message: 'There are currently no diffs for ' + masterUUID });
                    }
                    else {
                        res.json(200, doc);
                    }
                }
            });
        }
    });
};

exports.createDiff = function(req, res) {

    var masterUUID = req.params.uuid.toUpperCase(),
        now = new Date(),
        updateObj = {
            last_request: now
        };

    if (req.body.host_name) {
        updateObj.host_name = req.body.host_name.toLowerCase();
    }
    if (req.body.host_uuid) {
        updateObj.host_uuid = req.body.host_uuid.toUpperCase();
    }

    if (!updateObj.host_name && !updateObj.host_uuid) {
        res.json(400, { message: 'You must provide either a host_uuid or host_name' });
    }
    else {
        UUID.findOne({ _id: masterUUID }, function(err, doc) {
            if (err) {
                res.json(400, err);
            }
            else if (!doc) {
                res.json(400, { message: masterUUID + ' does not exist' });
            }
            else {
                UUIDDiffs.findOneAndUpdate({ uuid_id: masterUUID }, updateObj, { upsert: true }, function(err, doc) {
                    if (err) {
                        res.json(400, { message: err });
                    }
                    else {
                        res.json(200, {
                            host_name: doc.host_name,
                            host_uuid: doc.host_uuid,
                            last_request: doc.last_request,
                            _id: doc.uuid_id
                        });
                    }
                });
            }
        });
    }
};

exports.destroyDiff = function(req, res) {

    var uuid = req.params.uuid.toUpperCase();

    UUIDDiffs.remove({ uuid_id: uuid }, function(err, doc) {
        if (err) {
            res.json(400, err);
        }
        else {
            if (!doc) {
                res.json(400, { message: uuid + ' does not exist' });
            }
            else {
                res.json(200);
            }
        }
    });
};
