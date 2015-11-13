.PHONY: default install setup dev src prod watch clean
default: dev
install: s3

# Install dependencies - npm's postinstall does the rest of the work
setup:
	npm install
	./setup

# Do a quick build, don't rebuild vendor files if not necessary
build:
	$(MAKE) check-marten
	npm run build

dev: build

prod: clean
	$(MAKE) check-marten
	npm run build-production

watch:
	npm run watch

clean:
	rm -f *~ */*~
	rm -rf pub

# Copy pub/ into S3 bucket, do a make prod before hand to ensure that only
# production version is installed and we don't accidentally install dev
s3: prod
	./marten/s3-install.sh pub dir.esper.com

staging: prod
	./marten/s3-install.sh pub dir-staging.esper.com

# Check Marten repo is up to date
check-marten:
	./marten/version_check.sh
