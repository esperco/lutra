.PHONY: default setup clean
default: setup

# Put bower and tsd in path
export PATH := node_modules/.bin:$(PATH)

# Fetch libraries
setup: vendor
	$(MAKE) -C grison setup
	$(MAKE) -C otter setup
	$(MAKE) -C stoat setup
	$(MAKE) -C zorilla setup

vendor:
	npm install
	tsd reinstall -so

# Remove derived files
clean:
	$(MAKE) -C grison clean
	$(MAKE) -C esper.com clean
	$(MAKE) -C otter clean
	$(MAKE) -C stoat clean
	$(MAKE) -C zorilla clean
