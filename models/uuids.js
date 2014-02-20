var mongoose = require('mongoose');

var UUIDSchema = mongoose.Schema({
    hostname: String,
    uuid: String,
    state: String,
});

var UUID = mongoose.model('UUID', UUIDSchema);

module.exports = {
    UUID: UUID
}
