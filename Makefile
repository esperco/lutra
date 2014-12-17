.PHONY: default install local-install s3 clean
default: local-install
install: s3

# Copy public files into pub/
local-install:
	$(MAKE) -C css
	./local-install

# Copy pub/ into S3 bucket
s3:
	./s3-install

clean:
	rm -f *~ */*~
	rm -rf pub
	$(MAKE) -C css clean
