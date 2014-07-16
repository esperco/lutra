.PHONY: default injected-script build install clean
default: injected-script

# Build and install javascript files
injected-script: build
	$(MAKE) install

# Build only
build: js/injected-script.js

# External JavaScript libraries (needed at runtime only).
# sha1 is part of cryptojs.
# The chrome library is part of the environment provided by Chrome.
JS_LIBS = \
  jquery \
  gmail \
  sha1

# External TypeScript libraries and type definitions for
# the external JavaScript libraries (needed at compile time).
TS_LIBS = \
  jquery.d \
  chrome.d \
  cryptojs.d

# Our own JavaScript code required in edge cases
APP_JS = \
  gmailInit

# Our own TypeScript definitions for external libraries
APP_DEFS = \
  gmail.d

# Preprocessed TypeScript code coming from another directory,
# path to file without .ts suffix
SHARED_SOURCES = \
  ../common/ts/Conf \
  ../common/ts/Util \
  ../common/ts/Log \
  ../common/EsperStorage \
  ../common/EsperMessage

# TypeScript sources that need to be preprocessed with 'oblivion'
# and then compiled into JavaScript by tsc.
# Output Javascript files are put into the js/ subdirectory.
APP_SOURCES = \
  Login \
  JsonHttp \
  ApiT \
  Api \
  Init \
  Main

# Paths to preprocessed TypeScript files from other directories
SHARED_TS = \
  $(addsuffix .ts,$(SHARED_SOURCES))

# Complete oblivion/TypeScript source file names
APP_TS_SRC = \
  $(addsuffix .ts,$(APP_SOURCES))

# Result of preprocessing by oblivion
APP_TS = \
  $(addprefix ts/,$(notdir $(APP_TS_SRC)))

# Input to TypeScript compiler
ALL_TS = \
  $(addsuffix .ts,$(addprefix ../setup/ts/,$(TS_LIBS))) \
  $(addsuffix .ts,$(APP_DEFS)) \
  $(SHARED_TS) \
  $(APP_TS)

# All JavaScript code not derived from our TypeScript files
EXTRA_JS = \
  $(addsuffix .js,$(addprefix ../setup/js/,$(JS_LIBS))) \
  $(addsuffix .js,$(APP_JS))

.PHONY: pp
pp: $(APP_TS)

ts/%.ts: %.ts
	@mkdir -p ts
	../setup/bin/oblivion $< -o $@

js/injected-script.js: $(ALL_TS)
	@mkdir -p js
	tsc --out js/injected-script-ts.js $(ALL_TS)
	cat $(EXTRA_JS) js/injected-script-ts.js > $@

install:
	mkdir -p ../pub/js
	cp js/injected-script.js ../pub/js/injected-script.js

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
