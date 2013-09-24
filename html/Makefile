.PHONY: default dev prod dev-build prod-build clean
default: app.html
dev: dev-build
prod: prod-build

dev-build:
	sed -e '/INCLUDES/r ../js/includes-dev.html' \
            -e '/INCLUDES/d' \
          app.html.in > app.html

prod-build:
	sed -e '/INCLUDES/r ../js/includes-prod.html' \
            -e '/INCLUDES/d' \
          app.html.in > app.html

clean:
	rm -f *~ app.html
