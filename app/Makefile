.PHONY: default setup dev src prod watch clean
default: dev

# Install dependencies - npm's postinstall does the rest of the work
setup:
	npm install

# Do a quick build, don't rebuild vendor files if not necessary
build:
	npm run build

dev: build

# Full build -- rebuild vendor files if necessary
rebuild:
	npm run rebuild

prod:
	npm run build-production

watch:
	npm run watch

clean:
	rm -f *~ */*~
	rm -rf pub

