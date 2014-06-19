.PHONY: default setup prod prod-build clean
default: prod

# Clean installation for production purposes
prod: prod-build
	rm -rf pub
	./install prod 2>&1 | tee -a install.log

prod-build:
	$(MAKE) -C ts build
	$(MAKE) -C css prod-build

# Fetch libraries
setup:
	$(MAKE) -C setup

# Remove derived files
clean:
	rm -rf pub *~ */*~
	$(MAKE) -C ts clean
	$(MAKE) -C css clean
