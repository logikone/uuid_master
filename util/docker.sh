#!/bin/bash

CONTAINER=$(docker run -d --name uuid_master_mongodb dockerfile/mongodb)
docker run -i -t --rm -p 8080:8080 -e NODE_ENV=development --link uuid_master_mongodb:db -v $(pwd):/src -w /src dockerfile/nodejs "$@"
docker stop $CONTAINER > /dev/null && docker rm $CONTAINER > /dev/null
