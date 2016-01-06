NPM Vendors
===========

This package exists to help us get NPM vendor files that we can't get
using Bower. It's separated from any other NPM package so it can be included
via Browserify without too much overhead. You should treat script files in this
directory (including anything pulled into node_modules) as code that will
be processed via Browserify.