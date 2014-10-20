.PHONY: default dev prod dev-build prod-build dev-install prod-install clean
default: dev

# Build and install javascript files
dev: dev-build
	$(MAKE) dev-install
prod: prod-build
	$(MAKE) prod-install

# Build only
dev-build: pp includes-dev.html
prod-build: prod.js includes-prod.html

# Javascript libraries that are made available by the setup process.
# When available, we use the non-minified version for debugging (DEV),
# and the minified version for production (PROD).

COMMON_LIBS = \
  jquery \
  bootstrap \
  can

APP_LIBS = \
  sha1 \
  jquery-ui

COMMON_DEV_LIBS = $(addsuffix .js, $(COMMON_LIBS))
APP_DEV_LIBS = $(addsuffix .js, $(APP_LIBS))

COMMON_PROD_LIBS = $(addsuffix .min.js, $(COMMON_LIBS))
APP_PROD_LIBS = $(addsuffix .min.js, $(APP_LIBS))


# Quasi-Javascript sources that need to be preprocessed with 'oblivion'.
# Output Javascript files are put into the js/ subdirectory.

COMMON_SOURCES =
#  test.js \
#  list.js \
#  log.js \
#  deferred.js \
#  util.js \
#  mixpanel.js \
#  gmailCompose.js \
#  status_.js \
#  unixtime.js \
#  cache.js \
#  svg.js \
#  show.js \
#  select.js \
#  store.js

APP_SOURCES =
#  parseUrl.js \
#  login.js \
#  api.js \
#  settings.js \
#  signin.js \
#  page.js \
#  route.js \
#  main.js

TS_LIBS = \
  jquery.d

# TypeScript sources that need to be preprocessed with 'oblivion'
# and then compiled into JavaScript by tsc.
# Output Javascript files are put into the js/ subdirectory.
# for executive preferences page
TS_SOURCES = \
  Test \
  List \
  Log \
  Deferred \
  Util \
  Mixpanel \
  GmailCompose \
  Status \
  Unixtime \
  Cache \
  Svg \
  Show \
  Select \
  Store \
  ParseUrl \
  Login \
  Api \
  Settings \
  Signin \
  ExecutivePreferences \
  Page \
  Route \
  Main

# Complete oblivion/TypeScript source file names for executive preferences page
TS_SRC = \
  $(addsuffix .ts,$(TS_SOURCES))

# Result of preprocessing by oblivion
TS_OBLIVION = \
  $(addprefix ts/,$(notdir $(TS_SRC)))

# Input to tsc
TS = \
  $(TS_OBLIVION) \
  $(addsuffix .ts,$(addprefix ../setup/ts/,$(TS_LIBS)))

# These don't get minified
PROD_FLAGS = prod_flags.js
DEV_FLAGS = dev_flags.js

COMMON_JS = $(addprefix js/,$(COMMON_SOURCES))
APP_JS = $(addprefix js/,$(APP_SOURCES))

.PHONY: pp
pp: $(COMMON_JS) $(APP_JS)

js/%.js: %.js
	@mkdir -p js
	../setup/bin/oblivion $< -o $@

ts/%.ts: %.ts
	@mkdir -p ts
	../setup/bin/oblivion -ts $< -o $@

js/all-typescript.js: $(TS)
	@mkdir -p js
	tsc --out js/all-typescript.js $(TS) || (rm js/all-typescript.js; exit 1)

# Development: keep each file separate for easier debugging
# (preserve source locations)
includes-dev.html: Makefile mkloader
	./mkloader $(COMMON_DEV_LIBS) $(APP_DEV_LIBS) \
		   $(COMMON_SOURCES) $(APP_SOURCES) > $@

includes-prod.html: Makefile mkloader
	./mkloader $(COMMON_PROD_LIBS) $(APP_PROD_LIBS) app.js > $@

# Production: concatenate all files into one for speed
prod.js: $(COMMON_JS) $(APP_JS)
	cat $(COMMON_JS) $(APP_JS) | uglifyjs -o $@

dev-install: $(COMMON_JS) $(APP_JS) js/all-typescript.js
	mkdir -p ../pub/js
	cp $(DEV_FLAGS) ../pub/js/flags.js
	#cp $(COMMON_JS) ../pub/js
	#cp $(APP_JS) ../pub/js
	cp js/all-typescript.js ../pub/js

prod-install: js/all-typescript.js
	mkdir -p ../pub/js
	cp $(PROD_FLAGS) ../pub/js/flags.js
	cp prod.js ../pub/js/app.js
	cp js/all-typescript.js ../pub/js

clean:
	rm -f *~ prod.js includes-*.html run-tests.js
	rm -rf js/ ts/
