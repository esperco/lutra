.PHONY: default setup prod prod-build clean
default: prod

# Clean installation for production purposes
prod: prod-build
	rm -rf pub
	./install prod 2>&1 | tee -a install.log

prod-build:
	$(MAKE) -C common
	$(MAKE) -C content-script build
	$(MAKE) -C injected-script build
	$(MAKE) -C css prod-build

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
