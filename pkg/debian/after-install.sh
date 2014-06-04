#!/bin/sh

mv /var/tmp/default.json /etc/uuid-master/default.json
chown uuidmaster.uuidmaster /etc/uuid-master/default.json
chown -R uuidmaster.uuidmaster /usr/share/uuid-master
chown uuidmaster /var/log/uuid-master
