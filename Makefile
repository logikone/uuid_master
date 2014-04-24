PREFIX := "/usr/local"
CONFDIR := "$(PREFIX)/share/uuid_master_api/config"
INSTALLCONF := true

build:
	npm install

test: build
	@./node_modules/.bin/mocha --reporter spec --timeout 5000
	rm config/runtime.json

jshint:
	@./node_modules/.bin/jshint app.js lib/ routes/ test/ models/

install:
	npm install --production
	npm prune --production
	install -d $(DESTDIR)$(PREFIX)/share/uuid_master_api/node_modules
	install -d $(DESTDIR)$(PREFIX)/share/uuid_master_api/lib
	install -d $(DESTDIR)$(PREFIX)/share/uuid_master_api/log
	install -d $(DESTDIR)$(PREFIX)/share/uuid_master_api/models
	install -d $(DESTDIR)$(PREFIX)/share/uuid_master_api/routes
	install app.js $(DESTDIR)$(PREFIX)/share/uuid_master_api
ifeq ($(INSTALLCONF),true)
	install -d $(DESTDIR)$(CONFDIR)
	install config/default.json $(DESTDIR)$(CONFDIR)
else
	install -d $(DESTDIR)/var/tmp
	install config/default.json $(DESTDIR)/var/tmp
endif
	cp -r node_modules/* $(DESTDIR)$(PREFIX)/share/uuid_master_api/node_modules
	cp -r lib/* $(DESTDIR)$(PREFIX)/share/uuid_master_api/lib
	cp -r models/* $(DESTDIR)$(PREFIX)/share/uuid_master_api/models
	cp -r routes/* $(DESTDIR)$(PREFIX)/share/uuid_master_api/routes
	find $(DESTDIR)$(PREFIX)/share/uuid_master_api -type f -exec chmod 0644 \{\} \;
	find $(DESTDIR)$(PREFIX)/share/uuid_master_api -type d -exec chmod 0755 \{\} \;

clean:
	rm -rf ./node_modules

.PHONY: build test jshint install clean
