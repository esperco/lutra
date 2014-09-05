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
sudo npm remove -g less        # in case it's already installed
npm config set prefix ~/npm
```

And then add `~/npm/bin` to your `PATH` environment variable.


```
$ npm install -g typescript
```

```
$ tsc -v
Version 1.0.1.0
```

```
$ npm install -g less
```

```
$ lessc -v
lessc 1.7.2 (Less Compiler) [JavaScript]
```

HTTPS
=====

If the extension isn't showing up properly on your local setup, that could be an https issue, since it requests resources from your test server over http. (When in prod mode, it gets them from app.esper.com over https.)

To enable loading these resources, you can click the little grey shield icon on the righthand side of Chrome's URL bar.