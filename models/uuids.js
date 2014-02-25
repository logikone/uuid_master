var mongoose = require('mongoose');

var UUIDSchema = mongoose.Schema({
    host_name: String,
    host_uuid: String,
    uuid: String,
    state: String,
});

var UUID = mongoose.model('UUID', UUIDSchema);

module.exports = {
    UUID: UUID
}
