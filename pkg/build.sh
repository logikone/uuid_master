#!/bin/bash

# Check if we're in the project parent dir
if [[ $PWD =~ pkg$ ]]; then
    echo "You must be in the parent folder of this project to execute this command"
    exit 1 
fi

# Constants
[ ! -f .VERSION.mk ] && make -C .VERSION.mk
. .VERSION.mk
DESTDIR=build
DOCKER=0
MY_UUID=$(getent passwd chrisl | awk -F: '{print $3}')
DEB_REVISION="${REVISION}"
RPM_REVISION="${REVISION}"
URL="http://github.com/logikone/uuid-master"
DESCRIPTION="UUID Master is an API to generate and store uuids for hosts"

# Functions
function usage {
    echo "build.sh --dist <DISTRIBUTION> [--docker]"
}

function check_deps {
    if ! `which fpm`; then
        echo "Can't find fpm executable"
        exit 1
    fi

    if ! `which npm`; then
        echo "Can't find npm executable"
        exit 1
    fi
}

# Parameters
while [ "$1" != "" ]; do
    case $1 in
        -d | --dist )
            shift
            DISTRIBUTION=$1
            ;;
        --docker )
            DOCKER=1
            ;;
        --clean )
            CLEAN=1
            ;;
        * )
            usage
            exit 1;
    esac
    shift
done

if [ ! $DISTRIBUTION ]; then
    usage
    exit 1;
fi

if [ $DOCKER = 0 ]; then
    check_deps
fi

if [ $CLEAN = 1 ]; then
    make clean
fi

# Main 
case $DISTRIBUTION in

    ubuntu|debian|centos|redhat)
        BUILD_CMD="
            npm install --production;
            npm prune --production;
            install -d $DESTDIR/usr/share/uuid-master/node_modules;
            install -d $DESTDIR/usr/share/uuid-master/lib;
            install -d $DESTDIR/usr/share/uuid-master/models;
            install -d $DESTDIR/usr/share/uuid-master/routes;
            install -d $DESTDIR/var/log/uuid-master;
            install -d $DESTDIR/var/tmp;
            install -d $DESTDIR/etc/uuid-master;
            install -d $DESTDIR/etc/logrotate.d;
            install -m0644 app.js $DESTDIR/usr/share/uuid-master;
            install -m0644 config/default.json $DESTDIR/var/tmp;
            install -m0644 pkg/logrotate.conf $DESTDIR/etc/logrotate.d/uuid-master;
            cp -r node_modules/* $DESTDIR/usr/share/uuid-master/node_modules;
            cp -r lib/* $DESTDIR/usr/share/uuid-master/lib;
            cp -r models/* $DESTDIR/usr/share/uuid-master/models;
            cp -r routes/* $DESTDIR/usr/share/uuid-master/routes;
            find $DESTDIR/usr/share/uuid-master -type f -exec chmod 0644 \{\} \;;
            find $DESTDIR/usr/share/uuid-master -type d -exec chmod 0755 \{\} \;;
        "
        if [ $DOCKER = 1 ]; then
            BUILD_CMD="$BUILD_CMD chown -R $MY_UUID node_modules"
            echo $BUILD_CMD | docker run -i --rm -v $PWD:/src -w /src dockerfile/nodejs
        else
            eval $BUILD_CMD
        fi
        ;;
esac

case $DISTRIBUTION in
    ubuntu|debian)
        BUILD_CMD="
            install -d $DESTDIR/etc/default;
            install -d $DESTDIR/etc/init;
            install -d $DESTDIR/etc/init.d;
            install -m0644 pkg/uuid-master.default $DESTDIR/etc/default/uuid-master;
            install -m0755 pkg/uuid-master.sysv $DESTDIR/etc/init.d/uuid-master;
            install -m0644 pkg/uuid-master.upstart.ubuntu $DESTDIR/etc/init/uuid-master.conf;
        "
        ;;
    centos|redhat)
        BUILD_CMD="
            install -d $DESTDIR/etc/sysconfig;
            install -d $DESTDIR/etc/init.d;
            install -m0644 pkg/uuid-master.default $DESTDIR/etc/sysconfig/uuid-master;
            install -m0755 pkg/uuid-master.sysv $DESTDIR/etc/init.d/uuid-master;
        "
        ;;

    *)
        echo "Unknown OS: $DISTRIBUTION"
        exit 1
        ;;
esac

# Run BUILD_CMD
if [ $DOCKER = 1 ]; then
    BUILD_CMD="$BUILD_CMD chown -R $MY_UUID build;"
    echo $BUILD_CMD | docker run -i --rm -v $PWD:/src -w /src dockerfile/nodejs
else
    eval $BUILD_CMD
fi


case $DISTRIBUTION in
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
            --before-install pkg/'$DISTRIBUTION'/before-install.sh
            --before-remove pkg/'$DISTRIBUTION'/before-remove.sh
            --after-install pkg/'$DISTRIBUTION'/after-install.sh
            --config-files /etc/default/uuid-master
            --config-files /etc/logrotate.d/uuid-master
            -f -C '$DESTDIR' .'
    ;;
esac

if [ $DOCKER = 1 ]; then
    echo $FPM_CMD | docker run -i -u $MY_UUID --rm -v $PWD:/src -w /src dockerfile/fpm "$@"
else
    $FPM_CMD
fi

if [ $CLEAN = 1 ]; then
    make clean
fi

# vim: set ts=4 sw=4 et;
