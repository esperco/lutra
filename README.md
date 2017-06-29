# lutra
Our old TS 1.8 timestast front-end code. Currently supports the pages for
* /time - Exec time stats
* /manage - Exec time stats settings
* /now - Old Esper link landing page
* /test - Old tests for our lib code
* /test-time - Old tests for our lib code


Merges several previously separate repositories for front-end code:
* [Marten](https://github.com/esperco/marten) - Shared library code between different front-end components
* [Otter](https://github.com/esperco/otter) - Settings page at app.esper.com
* [Zorilla](https://github.com/esperco/zorilla) - Time Stats
* [Grison](https://github.com/esperco/grison) - Directory
* [Stoat](https://github.com/esperco/stoat) - Chrome extension
* [Honeybadger](https://github.com/esperco/stoat) - Static esper.com website

For everything else, see our
[Lutra Redux](https://github.com/esperco/lutra-redux) repo.

Setup
=====
On a new install, you'll need Node and Yarn first.

Setup Node
----------
We currently use Node.js's LTS branch (v6.x).
OS X users can install Node with the installer on https://nodejs.org.
Linux users should go [here](https://nodejs.org/en/download/package-manager/)/

Linux distros using Debian-based package managers (e.g. Ubuntu) can
run the following:

```
$ curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

To check your Node.js version:

```
$ nodejs --version
v6.10.2
```

Setup Yarn
----------
You should also install
[Yarn](https://yarnpkg.com/lang/en/docs/install/). Debian / Ubuntu users
can run the following:

```
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt-get update && sudo apt-get install yarn
```

To check your Yarn version:

```
$ yarn --version
0.24.5
```

To avoid using sudo with Yarn, configure Yarn to install globals in a
subdirectory that doesn't require sudo (like `~/.yarn`):

```
$ yarn config set prefix ~/.yarn
$ mkdir ~/.yarn
```

Then add `~/.yarn` to your path, e.g. in your `.bashrc`:

```
export PATH=$PATH:~/.yarn/bin
```

Other Setup
-----------
After installing Node and Yarn, call `make setup`.


Dependencies
============

Vendor Files
------------
We use NPM as our package manager because this works well with Browserify (we
previously used Bower for some non-JS assets, but an increasing number of
libraries are bundling non-JS assets in their NPM packages, so we're just
defaulting to using NPM).

`yarn add <package>` to add a new dependency. Depenencies are saved
in `node_modules`.

Typings
-------
TypeScript typings are installed via the Typings definition manager.
[Typings](https://github.com/typings/typings). To use, invoke
`node_modules/.bin/typings` (installed created after `make setup`).

Do not modify d.ts files in the `typings` directory directly. Either modify
typings in https://github.com/esperco/DefinitelyTyped (`typings.json` uses
definitions from there instead of the official DefinitelyTyped repo), or
fork or use definitions in a separate repo. This makes it easier for us to
merge upstream later if we want to open-source our definitions.


Development
===========
Call `make` to build the entire site and place in the `pub/` directory. This
allows you to check locally what the site looks like before going live.

Call `make watch` to launch a development server at `localhost:5001`.


Deployment
==========

Prerequisites
-------------
For production builds, you'll need to install `s3cmd` to upload to
Amazon S3. On Ubuntu, you should first install `pip` for Python2
(`s3cmd` does not work with Python3 as of 2016-03-16) and then use
`pip` to install `s3cmd`:

```
sudo apt-get install python-setuptools
sudo easy_install pip
sudo pip install s3cmd
```

Version 1.6 or above is required. Version 1.1.0 as prepackaged for
Ubuntu as of 2016-02-24 doesn't support the `--default-mime-type`
option. `pip` should intall the right version, but check the version:

```
$ s3cmd --version
s3cmd version 1.6.1
```

Obtain your personal access keys from the AWS console. The secret key
is personal and can be downloaded only once.

Give the S3 access keys to s3cmd:
```
s3cmd --configure
```

Now you are set up for uploading files to S3 using `s3cmd` (used
by `make install`).

Production Release
------------------
Merge the commits for release into the `release/esper.com` branch. Once the
branch is usable and a candidate for a release, call `make staging` to first
deploy to https://staging.esper.com/. If everything is fine on staging,
deploy to production with `./s3-install pub esper.com`.

Tag with the date and push back to origin:

```
git tag 20160316
git push origin release/esper.com --tags
```