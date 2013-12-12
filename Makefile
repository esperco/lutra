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
	$(MAKE) -C html dev-build
	$(MAKE) -C css dev-build

prod-build:
	$(MAKE) -C js prod-build
	$(MAKE) -C html prod-build
	$(MAKE) -C css prod-build

# Fetch libraries
setup:
	./setup

# Remove derived files
clean:
	rm -rf pub *~ */*~
	$(MAKE) -C js clean
	$(MAKE) -C html clean
	$(MAKE) -C css clean
