build:
	npm install

test:
	@./node_modules/.bin/mocha --reporter spec --timeout 5000

clean:
	rm -rf ./node_modules

.PHONY: build test clean
