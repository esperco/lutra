.PHONY: default setup dev prod dev-build prod-build install zip release clean
default: dev

manifest.json: manifest.json.in VERSION
	sed -e "s/@@VERSION@@/`cat VERSION`/g" manifest.json.in > $@

# Build and install development version that make API calls to localhost
dev: manifest.json
	$(MAKE) dev-build
	$(MAKE) install

# Make a production build
release:
	$(MAKE) clean
	$(MAKE) prod
	$(MAKE) zip


prod: manifest.json
	$(MAKE) prod-build
	$(MAKE) install

install:
	rm -rf pub
	./install prod 2>&1 | tee -a install.log

zip:
	rm -rf esper esper.zip
	cp -a pub esper
	zip -r esper esper

dev-build:
	$(MAKE) -C common dev-conf
	$(MAKE) build

prod-build:
	$(MAKE) -C common prod-conf
	$(MAKE) build

build:
	$(MAKE) -C common
	$(MAKE) -C content-script build
	$(MAKE) -C gmail-is build
	$(MAKE) -C gcal-is build
	$(MAKE) -C css

# Fetch libraries
setup:
	$(MAKE) -C setup

# Remove derived files
clean:
	rm -rf pub *~ */*~ manifest.json
	$(MAKE) -C common clean
	$(MAKE) -C content-script clean
	$(MAKE) -C gmail-is clean
	$(MAKE) -C gcal-is clean
	$(MAKE) -C css clean
