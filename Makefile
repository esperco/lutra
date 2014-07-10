.PHONY: default setup dev prod dev-build prod-build install clean
default: dev

dev:
	$(MAKE) dev-build
	$(MAKE) install

prod:
	$(MAKE) prod-build
	$(MAKE) install

install:
	rm -rf pub
	./install prod 2>&1 | tee -a install.log

dev-build:
	$(MAKE) -C common dev-conf
	$(MAKE) build

prod-build:
	$(MAKE) -C common prod-conf
	$(MAKE) build

build:
	$(MAKE) -C common
	$(MAKE) -C content-script build
	$(MAKE) -C injected-script build
	$(MAKE) -C css

# Fetch libraries
setup:
	$(MAKE) -C setup

# Remove derived files
clean:
	rm -rf pub *~ */*~
	$(MAKE) -C common clean
	$(MAKE) -C content-script clean
	$(MAKE) -C injected-script clean
	$(MAKE) -C css clean
