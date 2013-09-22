.PHONY: default setup dev prod dev-build prod-build clean
default: dev

# Copy public files into the pub/ directory without minifying
dev: dev-build
	./install dev
# Clean installation for production purposes
prod: prod-build
	rm -rf pub
	./install prod

dev-build:
	$(MAKE) -C js dev-build

prod-build:
	$(MAKE) -C js prod-build

# Fetch libraries
setup:
	./setup

# Remove derived files
clean:
	rm -rf pub *~ */*~
	$(MAKE) -C js clean
