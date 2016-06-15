.PHONY: default setup clean vendor
default: setup

# Put tsc and typings in path
export PATH := node_modules/.bin:$(PATH)

# Fetch libraries
setup: vendor
	$(MAKE) -C setup setup

vendor:
	npm install
	typings install

# Remove derived files
clean:
	$(MAKE) -C esper.com clean
	rm -rf otter
	rm -rf zorilla
	rm -rf marten
	rm -rf grison
	rm -rf setup
	rm -rf stoat
	rm -rf typings
