#!/usr/bin/env bash
set -e

# Get working directory based on location of this file
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $ROOT

# Check for Marten Git repository in sibling directory
if [ ! -d $ROOT/../marten ]; then
    cd $ROOT/..
    git clone git@github.com:esperco/marten.git
fi

cd $ROOT/../marten
git checkout master
git pull --ff-only origin master

# Go to project directory and link Marten from there
cd $ROOT
bash ../marten/link.sh
