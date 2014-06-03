#!/bin/sh

if ! getent group uuidmaster >/dev/null; then
    groupadd -r uuidmaster
fi

if ! getent passwd uuidmaster >/dev/nell; then
    useradd -M -r -g uuidmaster -d /usr/share/uuid_master \
        -s /sbin/nologin -c "UUID Master User" uuidmaster
fi
