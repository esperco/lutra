.PHONY: default dev prod dev-build prod-build dev-install prod-install clean
default: dev

# Build and install javascript files
dev: dev-build
prod: prod-build

# Used to be build-only, but build and installation are a single step now
dev-build:
	cd .. && npm run build
	$(MAKE) includes-dev.html

prod-build:
	cd .. && npm run build-production
	$(MAKE) includes-prod.html

# Javascript libraries that are made available by the setup process.
# When available, we use the non-minified version for debugging (DEV),
# and the minified version for production (PROD).

JS_LIBS = \
  jquery \
  jquery-ui \
  bootstrap \
  can \
  sha1 \
  moment \
  fullCalendar

DEV_LIBS = $(addsuffix .js, $(JS_LIBS))
PROD_LIBS = $(addsuffix .min.js, $(JS_LIBS))

# Development: keep each file separate for easier debugging
# (preserve source locations)

includes-dev.html: Makefile mkloader
	./mkloader $(DEV_LIBS) app.js > $@

includes-prod.html: Makefile mkloader
	./mkloader $(PROD_LIBS) app.js > $@

clean:
	rm -f *~ includes-*.html run-tests.js Conf.ts
	rm -rf js/ ts/
