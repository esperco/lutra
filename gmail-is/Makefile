.PHONY: default gmail-is build install clean
default: gmail-is

# Build and install javascript files
gmail-is: build
	$(MAKE) install

# Build only
build: js/gmail-is.js

# External JavaScript libraries (needed at runtime only).
# sha1 is part of cryptojs.
# The chrome library is part of the environment provided by Chrome.
JS_LIBS = \
  jquery \
  jqueryui \
  gmail \
  sha1 \
  moment \
  moment-timezone \
  moment-timezone-data \
  fullCalendar \

# External TypeScript libraries and type definitions for
# the external JavaScript libraries (needed at compile time).
TS_LIBS = \
  jquery/jquery.d \
  jqueryui/jqueryui.d \
  chrome/chrome.d \
  cryptojs/cryptojs.d \
  moment/moment.d \
  fullCalendar/fullCalendar.d

# Our own JavaScript code required in edge cases
APP_JS = \
  gmailInit

# Our own TypeScript definitions for external libraries
APP_DEFS = \
  gmail.d

# Preprocessed TypeScript code coming from another directory,
# path to file without .ts suffix
SHARED_SOURCES = \
  ../common/ts/Esper \
  ../common/ts/HostUrl \
  ../common/ts/Types \
  ../common/ts/Conf \
  ../common/ts/List \
  ../common/ts/Lazy \
  ../common/ts/Util \
  ../common/ts/Watchable \
  ../common/ts/Promise \
  ../common/ts/XDate \
  ../common/ts/Log \
  ../common/ts/LRU \
  ../common/ts/Visited \
  ../common/ts/EsperStorage \
  ../common/ts/Message \
  ../common/ts/Login \
  ../common/ts/Profile \
  ../common/ts/JsonHttp \
  ../common/ts/ApiT \
  ../common/ts/Api

# TypeScript sources that need to be preprocessed with 'oblivion'
# and then compiled into JavaScript by tsc.
# Output Javascript files are put into the js/ subdirectory.
APP_SOURCES = \
  Gmail \
  Thread \
  ActiveThreads \
  CalCache \
  CalPicker \
  CalSearch \
  ComposeControls \
  ComposeToolbar \
  CurrentThread \
  FinalizeEvent \
  InviteControls \
  TaskList \
  Teams \
  EventWidget \
  Menu \
  Sidebar \
  TaskTab \
  UserTab \
  GroupTab \
  GroupScheduling \
  BackgroundEvents \
  TimeTracker \
  Inactivity \
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
	../setup/bin/oblivion -ts $< -o $@

js/gmail-is.js: $(ALL_TS)
	@mkdir -p js
	tsc --out js/gmail-is-ts.js $(ALL_TS)
	cat ../common/SaveGlobals.js \
            $(EXTRA_JS) \
            js/gmail-is-ts.js \
            ../common/RestoreGlobals.js > $@

install:
	mkdir -p ../pub/js
	cp js/gmail-is.js ../pub/js/gmail-is.js
	mkdir -p ../pub/css
	cp ../setup/css/fullCalendar.css ../pub/css

clean:
	rm -f *~
	rm -rf ts/
	rm -rf js/
