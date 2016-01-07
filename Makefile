.PHONY: default setup clean
default: setup

# Fetch libraries
setup:
	npm install
	$(MAKE) -C grison setup
	$(MAKE) -C otter setup
	$(MAKE) -C stoat setup
	$(MAKE) -C zorilla setup

# Remove derived files
clean:
	$(MAKE) -C grison clean
	$(MAKE) -C esper.com clean
	$(MAKE) -C otter clean
	$(MAKE) -C stoat clean
	$(MAKE) -C zorilla clean
