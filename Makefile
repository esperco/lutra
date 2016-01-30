.PHONY: default setup clean vendor
default: setup

# Put bower and tsd in path
export PATH := node_modules/.bin:$(PATH)

# Fetch libraries
setup: vendor
	$(MAKE) -C setup setup

vendor:
	npm install
	typings install

# Remove derived files
clean:
	$(MAKE) -C setup clean
	$(MAKE) -C esper.com clean
	$(MAKE) -C stoat clean
	rm -rf otter
	rm -rf zorilla
	rm -rf marten
	rm -rf typings
