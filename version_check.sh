#!/usr/bin/env bash
set -e

# Script to check if current version of Marten contains specified commit
# Takes a single argument referencing a file with the commit line (defaults
# to MARTEN_VERSION in the current working directory)

# Get local dir for marten
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Get default arg / filename
if [ -z "$1" ]
  then COMMIT_FILE="MARTEN_VERSION"
  else COMMIT_FILE="$1"
fi

# Loop through each line in file and check if requested commits are there
while read COMMIT; do
  # Check if current branch contains requested commit (each on a new line)
  cd $DIR
  if git branch --contains $COMMIT | grep "*"
    then
      echo -e "\e[92mOK: Commit $COMMIT exists"
    else
      echo -e "\e[91mERROR: Commit $COMMIT not on current branch"
      exit 1
  fi
done <$COMMIT_FILE
