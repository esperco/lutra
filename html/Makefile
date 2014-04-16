.PHONY: default dev prod guest-app dev-build prod-build guest-app-build clean
default: dev
dev: dev-build
prod: prod-build
guest-app: guest-app-build

HTML_INCLUDES = \
  calendar-view.html \
  home-header.html \
  home-sidebar.html \
  list-view.html \
  request-password.html \
  reset-password.html \
  messages-tab.html \
  sched-task-list.html \
  places.html \
  settings.html \
  email-verify.html

dev-build:
	sed -e '/INCLUDES/r ../js/includes-dev.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html
	sed -e '/INCLUDES/r ../js/includes-dev-guest-app.html' \
            -e '/INCLUDES/d' \
          guest-app.html.in \
	> guest-app.html

prod-build:
	sed -e '/INCLUDES/r ../js/includes-prod.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html
	sed -e '/INCLUDES/r ../js/includes-prod-guest-app.html' \
            -e '/INCLUDES/d' \
          guest-app.html.in \
	> guest-app.html

clean:
	rm -f *~ app.html guest-app.html
