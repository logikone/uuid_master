UUID Master
===========

UUID Master is a simple API for generating and storing UUIDs to track hosts across multiple systems. For example: provisioning system, inventory system, logging infrastructure (tag all logs from a particular host with its UUID), config management.

Hosts do have a UUID associated with their motherboard, but in the event of hardware failure, or a VM that is rebuilt this UUID will change. This system will allow you to generate a UUID that can follow a host through rebuilds, failures, name changes, etc.
