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

.PHONY: build test jshint install clean
