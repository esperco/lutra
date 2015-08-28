.PHONY: default setup clean
default: setup

# Install dependencies - npm's postinstall does the rest of the work
setup:
	$(MAKE) -C setup
	npm install

clean:
	rm -f *~ */*~
	rm -rf node_modules
	$(MAKE) -C setup clean
