.PHONY: default dev prod dev-build prod-build dev-install prod-install clean
default: dev

# Build and install javascript files
dev: dev-build
	$(MAKE) dev-install
prod: prod-build
	$(MAKE) prod-install

# Build only
dev-build: dev.js
prod-build: prod.js

SOURCES = main.js

# Development: keep each file separate for easier debugging
# (preserve source locations)
dev.js: Makefile mkloader
	./mkloader $(SOURCES) > $@

# Production: concatenate all files into one for speed
prod.js: $(SOURCES)
	cat $< | uglifyjs > $@

dev-install:
	mkdir -p ../pub/js
	cp dev.js ../pub/js/app.js
	cp $(SOURCES) ../pub/js

prod-install:
	mkdir -p ../pub/js
	cp prod.js ../pub/js/app.js

clean:
	rm -f *~ dev.js prod.js
