#!/usr/bin/env bash

# Script to npm link this package.
# Call from root of package you want to link from.

# Capture working dir
OLD_PWD="$(pwd)"

# Get local dir of package
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Make setup Marten
cd $DIR/setup && make setup

# NPM link marten-gulp-helpers package
cd $DIR/gulp-helpers && npm link
cd $OLD_PWD && npm link marten-gulp-helpers

# NPM link marten-npm-vendors package
cd $DIR/npm-vendors && npm link
cd $OLD_PWD && npm link marten-npm-vendors

# Create symlink to Marten
rm -f marten
cd $OLD_PWD && ln -s $DIR ./marten

# Create .bowerrc file pointing to Marten's vendor dir
echo "{\"directory\": \"marten/vendor\"}" > .bowerrc
