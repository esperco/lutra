.PHONY: default dev prod dev-build prod-build clean
default: dev
dev: dev-build
prod: prod-build

HTML_INCLUDES = \
  all-tasks.html \
  arch-task-list.html \
  gen-task-list.html \
  request-password.html \
  reset-password.html \
  new-task.html \
  sched-step1-tab.html \
  sched-step2-tab.html \
  sched-step3-tab.html \
  sched-step4-tab.html \
  sched-task-list.html \
  places.html \
  edit-place.html \
  settings.html

dev-build:
	sed -e '/INCLUDES/r ../js/includes-dev.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html

prod-build:
	sed -e '/INCLUDES/r ../js/includes-prod.html' \
            -e '/INCLUDES/d' \
          app.html.in \
	| ./inject-files $(HTML_INCLUDES) \
	> app.html

clean:
	rm -f *~ app.html
