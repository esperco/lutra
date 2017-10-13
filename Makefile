.PHONY: default setup clean refresh vendor build staging
default: build

# Put tsc and typings in path
#
# Gotcha: for the directory below to be correct, `make` should be called from
# the same directory as this Makefile.
export SHELL := /bin/bash
export PATH := $(shell pwd)/node_modules/.bin:$(PATH)

# Fetch libraries, then symlink pub dir for lutra-redux
setup: vendor
	mkdir -p esper.com
	rm -f esper.com/pub
	ln -s ../pub esper.com/pub

vendor:
	yarn
	typings install

# Remove old files + setup
clean:
	rm -rf esper.com
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
