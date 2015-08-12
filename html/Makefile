.PHONY: default dev prod guest-app dev-build prod-build guest-app-build clean
default: dev
dev: dev-build
prod: prod-build
guest-app: guest-app-build

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

HTML_INCLUDES =

dev-build: includes-dev.html
	sed -e '/INCLUDES/r includes-dev.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html

prod-build: includes-prod.html
	sed -e '/INCLUDES/r includes-prod.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html

clean:
	rm -f *~ app.html
