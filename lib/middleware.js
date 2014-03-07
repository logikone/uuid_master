// Catch Json Parse failure
exports.jsonParseFailure = function(err, req, res, next) {

    if (err) {
        res.json(500, { message: 'json parse failure' });
    }
    else {
        next();
    }
};

exports.checkHeaders = function(req, res, next) {

    var errorMessage = "Invalid Content-Type header. Must be 'application/json'";

    if (!req.is('application/json')) {
        res.json(400, { message: errorMessage });
    }
    else {
        next();
    }
};
