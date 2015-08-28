#!/usr/bin/env bash

# Script to npm link this package.
# Call from root of package you want to link from.

# Capture working dir
OLD_PWD="$(pwd)"

# Get local dir of package
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Link gulp-helpers
cd $DIR && npm link
cd $OLD_PWD && npm link marten-gulp-helpers

# Link npm-vendors
cd $DIR/../npm-vendors && npm link
cd $OLD_PWD && npm link marten-npm-vendors
