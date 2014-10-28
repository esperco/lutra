.PHONY: default dev prod guest-app dev-build prod-build guest-app-build clean
default: dev
dev: dev-build
prod: prod-build
guest-app: guest-app-build

HTML_INCLUDES =

dev-build:
	sed -e '/INCLUDES/r ../ts/includes-dev.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html

prod-build:
	sed -e '/INCLUDES/r ../ts/includes-prod.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html

clean:
	rm -f *~ app.html
