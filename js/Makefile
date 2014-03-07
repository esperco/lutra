.PHONY: default dev prod dev-build prod-build dev-install prod-install clean
default: dev

# Build and install javascript files
dev: dev-build
	$(MAKE) dev-install
prod: prod-build
	$(MAKE) prod-install

# Build only
dev-build: includes-dev.html includes-dev-guest-app.html
prod-build: prod.js guest-app.js includes-prod.html includes-prod-guest-app.html

# Quasi-Javascript sources that need to be preprocessed with 'oblivion'.
# Output Javascript files are put into the js/ subdirectory.

COMMON_SOURCES = \
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
  observable.js \
  pusher.js \
  profile.js \
  geo.js \
  chat.js \
  sched.js \
  display.js

APP_SOURCES = \
  login.js \
  api.js \
  sample.js \
  adder.js \
  calpicker.js \
  loceditor.js \
  locpicker.js \
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
  main.js

GUESTAPP_SOURCES = \
  guest_api.js \
  guest_task.js \
  guest_login.js \
  guest_main.js

COMMON_JS = $(addprefix js/,$(COMMON_SOURCES))
APP_JS = $(addprefix js/,$(APP_SOURCES))
GUESTAPP_JS = $(addprefix js/,$(GUESTAPP_SOURCES))

.PHONY: pp
pp: $(COMMON_JS) $(APP_JS) $(GUESTAPP_JS)

js/%.js: %.js
	@mkdir -p js
	oblivion $< -o $@

# Development: keep each file separate for easier debugging
# (preserve source locations)
includes-dev.html: Makefile mkloader
	./mkloader $(COMMON_SOURCES) $(APP_SOURCES) > $@

includes-prod.html: Makefile mkloader
	./mkloader app.js > $@

includes-dev-guest-app.html: Makefile mkloader
	./mkloader $(COMMON_SOURCES) $(GUESTAPP_SOURCES) \
		> includes-dev-guest-app.html

includes-prod-guest-app.html: Makefile mkloader
	./mkloader guest-app.js > includes-prod-guest-app.html

# Production: concatenate all files into one for speed
prod.js: $(COMMON_JS) $(APP_JS)
	cat $(COMMON_JS) $(APP_JS) | uglifyjs -o $@

guest-app.js: $(COMMON_JS) $(GUESTAPP_JS)
	cat $(COMMON_JS) $(GUESTAPP_JS) | uglifyjs -o $@

dev-install: $(COMMON_JS) $(APP_JS) $(GUESTAPP_JS)
	mkdir -p ../pub/js
	cp $(COMMON_JS) ../pub/js
	cp $(APP_JS) ../pub/js
	cp $(GUESTAPP_JS) ../pub/js

prod-install:
	mkdir -p ../pub/js
	cp prod.js ../pub/js/app.js
	cp guest-app.js ../pub/js

clean:
	rm -f *~ prod.js guest-app.js includes-*.html run-tests.js
	rm -rf js/
