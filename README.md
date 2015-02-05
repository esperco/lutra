Stoat
=====

Esper extension for Google Chrome

Setup
=====

Recent versions of Node.js, npm, and TypeScript are required.

See the following URL for details on how to install nodejs and and
npm:
https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager

Ubuntu 12.04
------------

```
$ sudo add-apt-repository ppa:chris-lea/node.js
$ sudo apt-get update
$ sudo apt-get install python-software-properties python g++ make nodejs
```

```
$ nodejs --version
v0.10.28
```

Everyone
--------

Avoid having to use `sudo` for `npm`:
```
sudo npm remove -g typescript  # in case it's already installed
sudo npm remove -g uglify-js   # in case it's already installed
sudo npm remove -g less        # in case it's already installed
npm config set prefix ~/npm
```

And then add `~/npm/bin` to your `PATH` environment variable.


```
npm install -g typescript
npm install -g uglify-js
npm install -g less
```

```
$ tsc -v
Version 1.3.0.0
```

```
$ lessc -v
lessc 1.7.2 (Less Compiler) [JavaScript]
```

HTTPS
=====

If the extension isn't showing up properly on your local setup, that
could be an https issue, since it requests resources from your test
server over http. (When in prod mode, it gets them from app.esper.com
over https.)

To enable loading these resources, you can click the little grey
shield icon on the righthand side of Chrome's URL bar.

How to make a production release
================================

Once the `master` branch is usable and candidate for a release, you
need to perform the following:

1. edit the `VERSION` file, change the version ID e.g. `1.2.34`
2. commit the version file: `git commit VERSION`
3. tag this latest commit for future reference: `git tag v1.2.34`
4. push this commit and the tag to Github: `git push origin master --tags`
5. build and package up the extension for upload to the
   [Chrome Dashboard](https://chrome.google.com/webstore/developer/dashboard)
   using `make release`

