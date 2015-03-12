.PHONY: default setup dev prod dev-build prod-build clean
default: dev

# Copy public files into the pub/ directory without minifying
dev: dev-build
	./install dev 2>&1 | tee -a install.log

# Clean installation for production purposes
prod: prod-build
	rm -rf pub
	./install prod 2>&1 | tee -a install.log
	@echo "*** 'make prod' only builds otter files for production."
	@echo ""
	@echo "*** otter and wolverine files can be installed without a"
	@echo "*** server restart using the command:"
	@echo ""
	@echo "      ~/service/api/master/install"

dev-build:
	$(MAKE) -C ts dev-build
	$(MAKE) -C html dev-build
	$(MAKE) -C css dev-build

prod-build:
	$(MAKE) -C ts prod-build
	$(MAKE) -C html prod-build
	$(MAKE) -C css prod-build

# Fetch libraries
setup:
	$(MAKE) -C setup

# Remove derived files
clean:
	rm -rf pub *~ */*~
	$(MAKE) -C ts clean
	$(MAKE) -C html clean
	$(MAKE) -C css clean
