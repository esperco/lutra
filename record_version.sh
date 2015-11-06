#!/usr/bin/env bash
set -e

# Capture working dir
OLD_PWD="$(pwd)"

# Get local dir for marten
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Get default arg / filename
if [ -z "$1" ]
  then COMMIT_FILE="MARTEN_VERSION"
  else COMMIT_FILE="$1"
fi

# Get current version
cd $DIR
COMMIT="$( git log --pretty=format:'%H' -n 1 )"

# Check if already in commit file; if not, append
cd $OLD_PWD
if [ -f $COMMIT_FILE ] && [[ -n `grep $COMMIT $COMMIT_FILE` ]]
  then
    echo "Commit already in file."
  else
    echo "Writing commit to file."
    echo $COMMIT >> $COMMIT_FILE
fi
