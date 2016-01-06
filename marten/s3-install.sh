#!/usr/bin/env bash
set -e

target="$1"
s3_bucket="$2"

# Copy the pub/ directory into the S3 bucket specified

# Do CSS files first with forced mime (mime-magic guesses this incorrectly)
(cd $target && \
    s3cmd put \
      --mime-type=text/css \
      --exclude="*" \
      --include="*.css" \
      --add-header="Cache-Control:max-age=60" \
      --recursive * s3://$s3_bucket )

# Do SVG files next with forced mime (mime-magic guesses this incorrectly)
(cd $target && \
    s3cmd put \
      --mime-type=image/svg+xml \
      --exclude="*" \
      --include="*.svg" \
      --recursive * s3://$s3_bucket )

# Do remainder with guessed mime, defaulting to HTML (because of blanks)
(cd $target && \
    s3cmd put \
      --guess-mime-type \
      --exclude="*.css" \
      --exclude="*.svg" \
      --default-mime-type=text/html \
      --add-header="Cache-Control:max-age=60" \
      --recursive * s3://$s3_bucket )
