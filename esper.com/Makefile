.PHONY: default install local-install s3 clean setup

# Put gulp in path
export PATH := ../node_modules/.bin:$(PATH)

default: local-install
install: s3

# Copy public files into pub/
local-install:
	gulp build

prod:
	gulp build-production

# Copy pub/ into S3 bucket
s3: prod
	./s3-install pub esper.com

staging: prod
	./s3-install pub staging.esper.com

# Setup is actually in parent directory
setup:
	$(MAKE) -C ../ setup

clean:
	rm -f *~ */*~
	gulp clean

watch:
	if [ -z ${ts} ]; then gulp watch; else gulp watch --ts ${ts}; fi
