// Catch Json Parse failure
exports.jsonParseFailure = function(err, req, res, next) {

    if (err) {
        res.json(500, { message: 'json parse failure' });
    }
    else {
        next();
    }
};
