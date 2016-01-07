.PHONY: default install local-install s3 clean

# Put gulp in path
export PATH := ../node_modules/.bin:$(PATH)

default: local-install
install: s3

# Install dependencies
setup:
	npm install

# Copy public files into pub/
local-install:
	gulp build

prod:
	gulp build-production

# Copy pub/ into S3 bucket
s3: prod
	./s3-install

clean:
	rm -f *~ */*~
	gulp clean

watch:
	gulp watch
