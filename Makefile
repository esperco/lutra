.PHONY: default setup dev prod dev-build prod-build clean
default: dev

# Copy public files into the pub/ directory without minifying
dev: dev-build
	./install dev 2>&1 | tee -a install.log

# Clean installation for production purposes
prod: prod-build
	./install prod 2>&1 | tee -a install.log
	@echo "*** 'make prod' only builds otter files for production."
	@echo ""
	@echo "*** otter and wolverine files can be installed without a"
	@echo "*** server restart using the command:"
	@echo ""
	@echo "      ~/service/api/master/install"

dev-build:
	rm -rf pub
	npm run build
	$(MAKE) -C html dev-build

prod-build:
	rm -rf pub
	npm run build-production
	$(MAKE) -C html prod-build

# Fetch libraries
setup:
	npm install
	./setup.sh

# Remove derived files
clean:
	rm -rf pub *~ */*~
	$(MAKE) -C ts clean
	$(MAKE) -C html clean
	$(MAKE) -C css clean
