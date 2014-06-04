PREFIX := "/usr/local"
CONFDIR := "$(PREFIX)/share/uuid-master/config"
INSTALLCONF := true

build:
	npm install

test: build jshint
	npm test
	rm config/runtime.json

jshint:
	@./node_modules/.bin/jshint app.js lib/ routes/ test/ models/

docker/test: build jshint
	@./util/docker.sh npm test
	rm -f config/runtime.json

.VERSION.mk: REVISION=$(shell git rev-parse --short HEAD | tr -d ' ')
.VERSION.mk: RELEASE=$(shell npm version | grep uuid_master | awk '{print $$2}' | sed s/\'//g)
.VERSION.mk: DEV=$(shell echo $RELEASE | egrep '\.dev$$')
.VERSION.mk: MODIFIED=$(shell git diff --shortstat --exit-code > /dev/null ; echo $$?)
.VERSION.mk:
	$(QUIET)echo "RELEASE=${RELEASE}" > $@
	$(QUIET)echo "REVISION=${REVISION}" >> $@
	$(QUIET)echo "DEV=${DEV}" >> $@
	$(QUIET)echo "MODIFIED=${MODIFIED}" >> $@
	$(QUIET)if [ -z "${DEV}" ] ; then \
		if [ "${MODIFIED}" -eq 1 ] ; then \
			echo "VERSION=${RELEASE}-modified" ; \
		else \
			echo "VERSION=${RELEASE}" ; \
		fi ; \
	else \
		if [ "${MODIFIED}" -eq 1 ] ; then \
			echo "VERSION=${RELEASE}-${REVISION}-modified" ; \
		else \
			echo "VERSION=${RELEASE}-${REVISION}" ; \
		fi ; \
	fi >> $@

-include .VERSION.mk

version:
	@echo "Version: $(VERSION)"

install:
	npm install --production
	npm prune --production
	install -d $(DESTDIR)$(PREFIX)/share/uuid-master/node_modules
	install -d $(DESTDIR)$(PREFIX)/share/uuid-master/lib
	install -d $(DESTDIR)$(PREFIX)/share/uuid-master/log
	install -d $(DESTDIR)$(PREFIX)/share/uuid-master/models
	install -d $(DESTDIR)$(PREFIX)/share/uuid-master/routes
	install app.js $(DESTDIR)$(PREFIX)/share/uuid-master
ifeq ($(INSTALLCONF),true)
	install -d $(DESTDIR)$(CONFDIR)
	install config/default.json $(DESTDIR)$(CONFDIR)
else
	install -d $(DESTDIR)/var/tmp
	install config/default.json $(DESTDIR)/var/tmp
endif
	cp -r node_modules/* $(DESTDIR)$(PREFIX)/share/uuid-master/node_modules
	cp -r lib/* $(DESTDIR)$(PREFIX)/share/uuid-master/lib
	cp -r models/* $(DESTDIR)$(PREFIX)/share/uuid-master/models
	cp -r routes/* $(DESTDIR)$(PREFIX)/share/uuid-master/routes
	find $(DESTDIR)$(PREFIX)/share/uuid-master -type f -exec chmod 0644 \{\} \;
	find $(DESTDIR)$(PREFIX)/share/uuid-master -type d -exec chmod 0755 \{\} \;

clean:
	rm -rf ./node_modules
	rm -rf ./src

.PHONY: build test jshint install clean version
