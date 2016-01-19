.PHONY: default setup clean vendor
default: setup

# Put bower and tsd in path
export PATH := node_modules/.bin:$(PATH)

# Fetch libraries
setup: vendor
	$(MAKE) -C setup setup
	$(MAKE) -C grison setup

vendor:
	npm install
	tsd reinstall -so

# Remove derived files
clean:
	$(MAKE) -C setup clean
	$(MAKE) -C grison clean
	$(MAKE) -C esper.com clean
	$(MAKE) -C stoat clean
	rm -rf otter
	rm -rf zorilla
