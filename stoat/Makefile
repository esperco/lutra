.PHONY: default setup dev prod install zip release clean
.PHONY: install-dev install-prod
default: dev

# Put gulp in path
export PATH := ../node_modules/.bin:$(PATH)

manifest.json.dev: manifest.json.in VERSION
	sed -e "s/@@VERSION@@/`cat VERSION`/g" manifest.json.in > $@

# Get rid of localhost and other hosts used during development
manifest.json.prod: manifest.json.dev
	grep -v '"http://' $< > $@ || (rm -f $@; exit 1)

# Build and install development version that make API calls to localhost
dev: manifest.json.dev
	$(MAKE) -C common DevConf.ts
	gulp build
	./install dev 2>&1 | tee -a install.log

# Make a production build; see full instructions in README.md.
release:
	$(MAKE) clean
	$(MAKE) prod
	$(MAKE) zip

prod: manifest.json.prod
	$(MAKE) -C common ProdConf.ts
	gulp build-production
	./install prod 2>&1 | tee -a install.log

zip:
	rm -rf esper esper.zip
	cp -a pub esper
	zip -r esper esper

# Setup is actually in parent directory
setup:
	$(MAKE) -C ../ setup

watch:
	gulp watch

# Remove derived files
clean:
	rm -rf pub *~ */*~
	rm -f manifest.json manifest.json.dev manifest.json.prod
	$(MAKE) -C common clean 
