.PHONY: default dev prod guest-app dev-build prod-build guest-app-build clean
default: dev
dev: dev-build
prod: prod-build
guest-app: guest-app-build

HTML_INCLUDES = \
  email-verify.html \
  header.html \
  home-sidebar.html \
  meeting-workflow.html \
  meetings.html \
  messages-tab.html \
  request-password.html \
  reset-password.html \
  settings.html \
  onboarding.html \
  task-header.html


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
