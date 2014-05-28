UUID Master
===========

UUID Master is a simple API for generating and storing UUIDs to track hosts across multiple systems. For example: provisioning system, inventory system, logging infrastructure (tag all logs from a particular host with its UUID), config management.

Hosts do have a UUID associated with their motherboard, but in the event of hardware failure, or a VM that is rebuilt this UUID will change. This system will allow you to generate a UUID that can follow a host through rebuilds, failures, name changes, etc.

### Synopsis

```bash
  curl -XPOST http://localhost:8443/api/v1/uuids \
  -H 'Content-Type: application/json' \
  -d '{
    "host_name": "testhost01.yourmom.com",
    "host_uuid": "6c84fb90-12c4-11e1-840d-7b25c5ee775a"
  }'
```

```json
  "uuid": {
    "_id": "91AF6BE7-EE64-4D79-AFB6-0F5C801CE47C",
    "host_name": "testhost01.yourmom.com",
    "host_uuid": "6C84FB90-12C4-11E1-840D-7B25C5EE775A",
    "state": "PENDING",
    "last_request": "2014-05-28T23:05:42.345Z"
  }
```
