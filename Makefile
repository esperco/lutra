.PHONY: default install local-install s3 clean
default: local-install
install: s3

# Install dependencies
setup:
	npm install

# Copy public files into pub/
local-install:
	npm run build

# Copy pub/ into S3 bucket
s3:
	./s3-install

clean:
	rm -f *~ */*~
	rm -rf pub
