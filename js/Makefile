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

# Javascript libraries that are made available by the setup process.
# When available, we use the non-minified version for debugging (DEV),
# and the minified version for production (PROD).

COMMON_LIBS = \
  jquery \
  bootstrap \
  can \
  jquery.timeago \
  jquery.autosize \
  moment \
  moment-timezone \
  moment-timezone-data

APP_LIBS = \
  sha1 \
  jquery-ui \
  fullcalendar \
  jquery.timepicker \
  jquery-ui-core-datepicker \
  jstz

GUESTAPP_LIBS =

COMMON_DEV_LIBS = $(addsuffix .js, $(COMMON_LIBS))
APP_DEV_LIBS = $(addsuffix .js, $(APP_LIBS))
GUESTAPP_DEV_LIBS = $(addsuffix .js, $(GUESTAPP_LIBS))

COMMON_PROD_LIBS = $(addsuffix .min.js, $(COMMON_LIBS))
APP_PROD_LIBS = $(addsuffix .min.js, $(APP_LIBS))
GUESTAPP_PROD_LIBS = $(addsuffix .min.js, $(GUESTAPP_LIBS))


# Quasi-Javascript sources that need to be preprocessed with 'oblivion'.
# Output Javascript files are put into the js/ subdirectory.

COMMON_SOURCES = \
  type.js \
  test.js \
  list.js \
  deferred.js \
  ref.js \
  util.js \
  log.js \
  mixpanel.js \
  html.js \
  variant.js \
  dateYmd.js \
  date.js \
  timeonly.js \
  timezone.js \
  status_.js \
  spinner.js \
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
  calcache.js \
  calpicker.js \
  loceditor.js \
  locpicker.js \
  tzpicker.js \
  editevent.js \
  sched2.js \
  sched4.js \
  sched_setup.js \
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

# These don't get minified
PROD_FLAGS = prod_flags.js
DEV_FLAGS = dev_flags.js

COMMON_JS = $(addprefix js/,$(COMMON_SOURCES))
APP_JS = $(addprefix js/,$(APP_SOURCES))
GUESTAPP_JS = $(addprefix js/,$(GUESTAPP_SOURCES))

.PHONY: pp
pp: $(COMMON_JS) $(APP_JS) $(GUESTAPP_JS)

js/%.js: %.js
	@mkdir -p js
	../setup/bin/oblivion $< -o $@

# Development: keep each file separate for easier debugging
# (preserve source locations)
includes-dev.html: Makefile mkloader
	./mkloader $(COMMON_DEV_LIBS) $(APP_DEV_LIBS) \
		   $(COMMON_SOURCES) $(APP_SOURCES) > $@

includes-prod.html: Makefile mkloader
	./mkloader $(COMMON_PROD_LIBS) $(APP_PROD_LIBS) app.js > $@

includes-dev-guest-app.html: Makefile mkloader
	./mkloader $(COMMON_DEV_LIBS) $(GUESTAPP_DEV_LIBS) \
		   $(COMMON_SOURCES) $(GUESTAPP_SOURCES) \
		> includes-dev-guest-app.html

includes-prod-guest-app.html: Makefile mkloader
	./mkloader $(COMMON_PROD_LIBS) $(GUESTAPP_PROD_LIBS) guest-app.js \
		> includes-prod-guest-app.html

# Production: concatenate all files into one for speed
prod.js: $(COMMON_JS) $(APP_JS)
	cat $(COMMON_JS) $(APP_JS) | uglifyjs -o $@

guest-app.js: $(COMMON_JS) $(GUESTAPP_JS)
	cat $(COMMON_JS) $(GUESTAPP_JS) | uglifyjs -o $@

dev-install: $(COMMON_JS) $(APP_JS) $(GUESTAPP_JS)
	mkdir -p ../pub/js
	cp $(DEV_FLAGS) ../pub/js/flags.js
	cp $(COMMON_JS) ../pub/js
	cp $(APP_JS) ../pub/js
	cp $(GUESTAPP_JS) ../pub/js

prod-install:
	mkdir -p ../pub/js
	cp $(PROD_FLAGS) ../pub/js/flags.js
	cp prod.js ../pub/js/app.js
	cp guest-app.js ../pub/js

clean:
	rm -f *~ prod.js guest-app.js includes-*.html run-tests.js
	rm -rf js/
