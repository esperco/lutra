.PHONY: default local-install s3
default: local-install

# Copy public files into pub/
local-install:
	./local-install

# Copy pub/ into S3 bucket
s3:
	./s3-install
