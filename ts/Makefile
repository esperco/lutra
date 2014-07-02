.PHONY: default app build install clean
default: app

# Build and install javascript files
app: build
	$(MAKE) install

# Build only
build: js/app.js

# External JavaScript libraries (needed at runtime only).
# sha1 is part of cryptojs.
# The chrome library is part of the environment provided by Chrome.
JS_LIBS = \
  jquery \
  sha1

# External TypeScript libraries and type definitions for
# the external JavaScript libraries (needed at compile time).
TS_LIBS = \
  jquery.d \
  chrome.d \
  cryptojs.d


# TypeScript sources that need to be preprocessed with 'oblivion'
# and then compiled into JavaScript by tsc.
# Output Javascript files are put into the js/ subdirectory.
APP_SOURCES = \
  Util \
  Log \
  Login \
  ApiT \
  Api \
  Auth \
  Main

# Complete oblivion/TypeScript source file names
APP_TS_SRC = \
  $(addsuffix .ts,$(APP_SOURCES))

# Result of preprocessing by oblivion
APP_TS = \
  $(addprefix ts/,$(APP_TS_SRC))

# Input to TypeScript compiler
ALL_TS = \
  $(addsuffix .ts,$(addprefix ../setup/ts/,$(TS_LIBS))) \
  $(APP_TS)

# All JavaScript code to be packed into one file
ALL_JS = \
  $(addsuffix .js,$(addprefix ../setup/js/,$(JS_LIBS))) \
  $(addsuffix .js,$(addprefix js/,$(APP_SOURCES)))

.PHONY: pp
pp: $(COMMON_JS) $(APP_JS)

ts/%.ts: %.ts
	@mkdir -p ts
	../setup/bin/oblivion $< -o $@

js/app.js: $(ALL_TS)
	@mkdir -p js
	tsc --outDir js $(ALL_TS)
	cat $(ALL_JS) > js/app.tmp.js
	mv js/app.tmp.js $@

install:
	mkdir -p ../pub/js
	cp js/app.js ../pub/js/app.js

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
