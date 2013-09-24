.PHONY: default dev prod dev-build prod-build dev-install prod-install clean
default: dev

# Build and install javascript files
dev: dev-build
	$(MAKE) dev-install
prod: prod-build
	$(MAKE) prod-install

# Build only
dev-build: includes-dev.html
prod-build: prod.js includes-prod.html

SOURCES = sample.js login.js users.js main.js

# Development: keep each file separate for easier debugging
# (preserve source locations)
includes-dev.html: Makefile mkloader
	./mkloader $(SOURCES) > $@

includes-prod.html: Makefile mkloader
	./mkloader app.js > $@

# Production: concatenate all files into one for speed
prod.js: $(SOURCES)
	cat $(SOURCES) | uglifyjs > $@

dev-install:
	mkdir -p ../pub/js
	cp $(SOURCES) ../pub/js

prod-install:
	mkdir -p ../pub/js
	cp prod.js ../pub/js/app.js

clean:
	rm -f *~ prod.js includes-*.html
