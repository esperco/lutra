.PHONY: default dev prod dev-build prod-build dev-install prod-install clean
default: dev

dev: dev-build
prod: prod-build

# Used to be build-only, but build and installation are a single step now
dev-build:
	$(error 'This has been deprecated. Run `make` in parent dir to build all assets');

prod-build:
	$(error 'This has been deprecated. Run `make` in parent dir to build all assets');

includes-dev.html:
	$(error 'includes-dev.html moved to html dir');

includes-prod.html:
	$(error 'includes-prod.html moved to html dir');

clean:
	rm -f *~ includes-*.html run-tests.js Conf.ts
	rm -rf js/ ts/
