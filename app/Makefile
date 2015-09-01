.PHONY: default setup dev src prod watch clean
default: dev

# Install dependencies - npm's postinstall does the rest of the work
setup:
	npm install

# Do a quick build, don't rebuild vendor files if not necessary
src:
	npm run src

# Full build -- rebuild vendor files if necessary
build:
	npm run build

dev: src

prod:
	npm run build-production

watch:
	npm run watch

clean:
	rm -f *~ */*~
	rm -rf pub

