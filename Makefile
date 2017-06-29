.PHONY: default setup clean refresh vendor build staging
default: build

# Put tsc and typings in path
export PATH := node_modules/.bin:$(PATH)

# Fetch libraries
setup: vendor

vendor:
	yarn
	typings install

# Remove old files + setup
clean:
	rm -rf typings
	rm -f *~ */*~
	gulp clean

build:
	gulp build

# Clean nukes typings, requires that make setup be called again.
# Refresh is lighter and only cleans files in the pub directory
refresh:
	gulp clean
	gulp build

prod:
	gulp build-production

staging: prod
	./s3-install pub staging.esper.com

watch:
	if [ -z ${ts} ]; then gulp watch; else gulp watch --ts ${ts}; fi
