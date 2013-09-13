.PHONY: setup build clean

# Default target
build:
	./build-mink

setup:
	./setup-mink

# Remove files produced by 'build'
clean:
	rm -rf pub *~ */*~
