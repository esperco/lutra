.PHONY: default setup dev prod dev-build prod-build install zip release clean
.PHONY: install-dev install-prod
default: dev

manifest.json.dev: manifest.json.in VERSION
	sed -e "s/@@VERSION@@/`cat VERSION`/g" manifest.json.in > $@

# Get rid of localhost and other hosts used during development
manifest.json.prod: manifest.json.dev
	grep -v '"http://' $< > $@ || (rm -f $@; exit 1)

# Build and install development version that make API calls to localhost
dev: manifest.json.dev
	$(MAKE) dev-build
	$(MAKE) install-dev

tikhon: manifest.json.dev
	$(MAKE) tikhon-build
	$(MAKE) install-dev

# Make a production build; see full instructions in README.md.
release:
	$(MAKE) clean
	$(MAKE) prod
	$(MAKE) zip

prod: manifest.json.prod
	$(MAKE) prod-build
	$(MAKE) install-prod

install-dev:
	./install dev 2>&1 | tee -a install.log

install-prod:
	./install prod 2>&1 | tee -a install.log

zip:
	rm -rf esper esper.zip
	cp -a pub esper
	zip -r esper esper

tikhon-build:
	$(MAKE) -C common tikhon-conf
	$(MAKE) build-old
	npm run build

dev-build:
	$(MAKE) -C common dev-conf
	$(MAKE) build-old
	npm run build

# Build doesn't rebuild vendor files -- run rebuild to take care of those
# Dev only, production is always a rebuild
dev-rebuild:
	$(MAKE) -C common dev-conf
	$(MAKE) build-old
	npm run rebuild

prod-build:
	$(MAKE) -C common prod-conf
	$(MAKE) build-old
	npm run build-production

build-old:
	$(MAKE) -C common
	$(MAKE) -C event-page build
	$(MAKE) -C gmail-is build
	$(MAKE) -C gcal-is build

# Fetch Marten and install NPM dependencies
setup:
	npm install
	./setup

# Remove derived files
clean:
	rm -rf pub *~ */*~
	rm -f manifest.json manifest.json.dev manifest.json.prod
	rm node_modules
	$(MAKE) -C common clean
	$(MAKE) -C event-page clean
	$(MAKE) -C content-script clean
	$(MAKE) -C gmail-is clean
	$(MAKE) -C gcal-is clean
	$(MAKE) -C css clean
