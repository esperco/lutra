.PHONY: default setup dev prod dev-build prod-build install zip dropbox clean
default: dev

manifest.json: manifest.json.in VERSION
	sed -e "s/@@VERSION@@/`cat VERSION`/g" manifest.json.in > $@

dev: manifest.json
	$(MAKE) dev-build
	$(MAKE) install

tikhon: manifest.json
	$(MAKE) tikhon-build
	$(MAKE) install


prod: manifest.json
	$(MAKE) prod-build
	$(MAKE) install
	$(MAKE) zip

install:
	rm -rf pub
	./install prod 2>&1 | tee -a install.log

zip:
	rm -rf esper esper.zip
	cp -a pub esper
	zip -r esper esper

# Make a production build and put it into our Dropbox folder
dropbox:
	$(MAKE) clean
	$(MAKE) prod
	$(MAKE) zip
	mkdir -p ~/Dropbox/Esper/software/chrome
	cp -a esper esper.zip ~/Dropbox/Esper/software/chrome

tikhon-build:
	$(MAKE) -C common tikhon-conf
	$(MAKE) build

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
