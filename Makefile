prefix := "/usr/local/share"
build:
	npm install

test:
	@./node_modules/.bin/mocha --reporter spec --timeout 5000

install: build
	install -d $(prefix)/uuid_master_api/node_modules
	cp -r node_modules/* $(prefix)/uuid_master_api/node_modules
	find $(prefix)/uuid_master_api/node_modules -type f -exec chmod 0644 \{\} \;
	find $(prefix)/uuid_master_api/node_modules -type d -exec chmod 0755 \{\} \;

clean:
	rm -rf ./node_modules

.PHONY: build test install clean
