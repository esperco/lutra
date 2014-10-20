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

JS_LIBS = \
  jquery \
  bootstrap \
  can \
  sha1 \
  jquery-ui

DEV_LIBS = $(addsuffix .js, $(JS_LIBS))
PROD_LIBS = $(addsuffix .min.js, $(JS_LIBS))

TS_LIBS = \
  jquery.d

# TypeScript sources that need to be preprocessed with 'oblivion'
# and then compiled into JavaScript by tsc.
# Output Javascript files are put into the js/ subdirectory.
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
  ApiT \
  Api \
  Settings \
  Signin \
  ExecutivePreferences \
  Page \
  Route \
  Main

# Complete oblivion/TypeScript source file names
APP_TS_SRC = \
  $(addsuffix .ts,$(TS_SOURCES))

# Result of preprocessing by oblivion
APP_TS = \
  $(addprefix ts/,$(notdir $(APP_TS_SRC)))

# Input to tsc
ALL_TS = \
  $(APP_TS) \
  $(addsuffix .ts,$(addprefix ../setup/ts/,$(TS_LIBS)))

# These don't get minified
PROD_FLAGS = prod_flags.js
DEV_FLAGS = dev_flags.js

.PHONY: pp
pp: $(APP_TS)

ts/%.ts: %.ts
	@mkdir -p ts
	../setup/bin/oblivion -ts $< -o $@

js/app.js: $(ALL_TS)
	@mkdir -p js
	tsc --out js/app.js $(ALL_TS) || (rm js/app.js; exit 1)

# Development: keep each file separate for easier debugging
# (preserve source locations)
includes-dev.html: Makefile mkloader
	./mkloader $(DEV_LIBS) flags.js app.js > $@

includes-prod.html: Makefile mkloader
	./mkloader $(PROD_LIBS) flags.js app.js > $@

dev-install: $(COMMON_JS) $(APP_JS) js/app.js
	mkdir -p ../pub/js
	cp $(DEV_FLAGS) ../pub/js/flags.js
	cp js/app.js ../pub/js

prod-install: js/all-typescript.js
	mkdir -p ../pub/js
	cp $(PROD_FLAGS) ../pub/js/flags.js
	cp js/app.js ../pub/js

clean:
	rm -f *~ prod.js includes-*.html run-tests.js
	rm -rf js/ ts/
