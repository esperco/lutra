.PHONY: default setup dev src prod watch clean
default: dev

# Install dependencies - npm's postinstall does the rest of the work
setup:
	npm install

dev:
	npm run build

src:
	npm run build-src

prod:
	npm run build-production

watch:
	npm run watch

clean:
	rm -f *~ */*~
	rm -rf pub
	rm -rf node_modules

