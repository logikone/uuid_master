#!/bin/bash

if [[ $0 =~ "docker_package" ]]; then

    [ ! -f .VERSION.mk ] && make -C .VERSION.mk

    . .VERSION.mk

    MY_UUID=$(getent passwd chrisl | awk -F: '{print $3}')
    DEB_REVISION="${REVISION}"
    RPM_REVISION="${REVISION}"
    URL="http://github.com/logikone/uuid-master"
    DESCRIPTION="UUID Master is a simple API to generate uuids for hosts to be tracked across multiple systems"

    if [[ ! $1 ]]; then
        OS="ubuntu"
    else
        OS=$1
    fi

    DESTDIR=src

    case $OS in
        ubuntu|debian)
            npm install --production
            npm prune --production
            install -d $DESTDIR/usr/share/uuid-master/node_modules
            install -d $DESTDIR/usr/share/uuid-master/lib
            install -d $DESTDIR/usr/share/uuid-master/models
            install -d $DESTDIR/usr/share/uuid-master/routes
            install -d $DESTDIR/var/log/uuid-master
            install -d $DESTDIR/var/tmp
            install -d $DESTDIR/etc/uuid-master
            install -d $DESTDIR/etc/default
            install -d $DESTDIR/etc/init
            install -d $DESTDIR/etc/init.d
            install -d $DESTDIR/etc/logrotate.d
            install app.js $DESTDIR/usr/share/uuid-master
            install config/default.json $DESTDIR/var/tmp
            cp -r node_modules/* $DESTDIR/usr/share/uuid-master/node_modules
            cp -r lib/* $DESTDIR/usr/share/uuid-master/lib
            cp -r models/* $DESTDIR/usr/share/uuid-master/models
            cp -r routes/* $DESTDIR/usr/share/uuid-master/routes
            find $DESTDIR/usr/share/uuid-master -type f -exec chmod 0644 \{\} \;
            find $DESTDIR/usr/share/uuid-master -type d -exec chmod 0755 \{\} \;
            install -m644 pkg/uuid-master.default $DESTDIR/etc/default/uuid-master
            install -m644 pkg/logrotate.conf $DESTDIR/etc/logrotate.d/uuid-master
            install -m755 pkg/uuid-master.sysv $DESTDIR/etc/init.d/uuid-master
            install -m755 pkg/uuid-master.upstart.ubuntu $DESTDIR/etc/init/uuid-master.conf
            ;;
        *)
            echo "Unknown OS: $OS"
            exit 1
            ;;
    esac

    case $OS in
        ubuntu|debian)
            if ! echo $RELEASE | grep -q '\.(dev|rc.*)'; then
                RELEASE="$(echo $RELEASE | sed 's/\.\(dev\|rc.*\)/~\1/')"
            fi

            FPM_CMD='fpm -s dir -t deb -n uuid-master -v '$RELEASE'
                -a all --iteration "1-'$DEB_REVISION'"
                -p uuid-master-VERSION_ARCH.deb
                -d "nodejs (>=0.10.24)"
                -d "nodejs-legacy"
                --url "'$URL'"
                --description "'$DESCRIPTION'"
                --license "Apache 2.0"
                --maintainer "Chris Larsen"
                --deb-user uuidmaster
                --deb-group uuidmaster
                --before-install pkg/'$OS'/before-install.sh
                --before-remove pkg/'$OS'/before-remove.sh
                --after-install pkg/'$OS'/after-install.sh
                --config-files /etc/default/uuid-master
                --config-files /etc/logrotate.d/uuid-master
                -f -C '$DESTDIR' .'
        ;;
    esac

    echo $FPM_CMD | docker run -i -u $MY_UUID --rm -v $PWD:/src -w /src dockerfile/fpm "$@"
fi

if [[ $0 =~ "docker.sh" ]]; then
    CONTAINER=$(docker run -d --name uuid_master_mongodb dockerfile/mongodb)

    docker run -i -t --rm -p 8080:8080 -e NODE_ENV=development --link uuid_master_mongodb:db -v $(pwd):/src -w /src dockerfile/nodejs "$@"
    docker stop $CONTAINER > /dev/null && docker rm $CONTAINER > /dev/null
fi
