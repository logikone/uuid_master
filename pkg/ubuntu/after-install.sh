#!/bin/sh

mv /var/tmp/default.json /etc/uuid-master/default.json
chown uuidmaster.uuidmaster /etc/uuid-master/default.json
chown -R uuidmaster.uuidmaster /usr/share/uuid-master
chown uuidmaster /var/log/uuid-master
chown root.root /etc/init/uuid-master.conf
chmod 0644 /etc/init/uuid-master.conf
