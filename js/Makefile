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

SOURCES = \
  test.js \
  list.js \
  deferred.js \
  util.js \
  log.js \
  html.js \
  variant.js \
  date.js \
  timeonly.js \
  status_.js \
  unixtime.js \
  email.js \
  cache.js \
  svg.js \
  show.js \
  editor.js \
  select.js \
  store.js \
  login.js \
  api.js \
  sample.js \
  profile.js \
  chat.js \
  geo.js \
  calpicker.js \
  sched.js \
  sched1.js \
  sched2.js \
  sched3.js \
  sched4.js \
  task.js \
  settings.js \
  places.js \
  home.js \
  page.js \
  route.js \
  display.js \
  main.js

# Development: keep each file separate for easier debugging
# (preserve source locations)
includes-dev.html: Makefile mkloader
	./mkloader $(SOURCES) > $@

includes-prod.html: Makefile mkloader
	./mkloader app.js > $@

# Production: concatenate all files into one for speed
prod.js: $(SOURCES)
	cat $(SOURCES) | uglifyjs -o $@

dev-install:
	mkdir -p ../pub/js
	cp $(SOURCES) ../pub/js

prod-install:
	mkdir -p ../pub/js
	cp prod.js ../pub/js/app.js

clean:
	rm -f *~ prod.js includes-*.html run-tests.js
