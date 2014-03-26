var mongoose = require('mongoose');

var UUIDUpdatesSchema = mongoose.Schema({
    host_name: String,
    host_uuid: String,
    last_request: Date,
    uuid_id: String
});

var UUIDSchema = mongoose.Schema({
    host_name: String,
    host_uuid: String,
    id: String,
    state: String,
    last_request: Date
});

var UUID = mongoose.model('UUID', UUIDSchema);
var UUIDUpdates = mongoose.model('UUIDUpdates', UUIDUpdatesSchema);

module.exports = {
    UUID: UUID,
    UUIDUpdates: UUIDUpdates
}
