.PHONY: default install setup dev src prod watch clean
default: dev
install: s3

# Install dependencies - npm's postinstall does the rest of the work
setup:
	npm install
	./setup

# Do a quick build, don't rebuild vendor files if not necessary
build:
	npm run build

dev: build

prod: clean
	npm run build-production

watch:
	npm run watch

clean:
	rm -f *~ */*~
	rm -rf pub

# Copy pub/ into S3 bucket
s3:
	./s3-install
