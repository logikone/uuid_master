#!/bin/sh

if [ $1 = "remove" ]; then
    service uuid-master stop >/dev/null 2>&1 || true

    if getent passwd uuidmaster >/dev/null; then
        userdel uuidmaster
    fi

    if getent group uuidmaster >/dev/null; then
        groupdel uuidmaster
    fi
fi
