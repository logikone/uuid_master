var mongoose = require('mongoose'),
    uuid = require('mongoose-uuid');

var UUIDDiffsSchema = mongoose.Schema({
    host_name: String,
    host_uuid: String,
    last_request: Date,
    uuid_id: String
});

var UUIDSchema = mongoose.Schema({
    host_name: String,
    host_uuid: String,
    state: String,
    last_request: Date
},
{
    _id: false
});

UUIDSchema.plugin(uuid.plugin);

var UUID = mongoose.model('UUID', UUIDSchema);
var UUIDDiffs = mongoose.model('UUIDDiffs', UUIDDiffsSchema);

module.exports = {
    UUID: UUID,
    UUIDDiffs: UUIDDiffs
};
