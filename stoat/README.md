Stoat
=====

Esper extension for Google Chrome

![Stoat](https://c1.staticflickr.com/5/4102/4787565311_e08c73a690_z.jpg)

Setup
=====

Run `make setup` in Lutra root.

Build
=====

Run `make` to create an unpacked version of the extension for development
in the `pub` directory.

You can also run `make watch` to set up a process that watches and re-
compiles your TypeScript or LESS files on save.

If you change any third-party vendor requirements, you may need to run
`make clean` before running `make` again.

Once the package is built, load the Chrome extension by following the
directions at https://developer.chrome.com/extensions/getstarted#unpacked.

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

Merge the commits for release into the `release/stoat` branch. Once the 
branch is usable and a candidate for a release, you need to perform the
following:

1. edit the `VERSION` file, change the version ID e.g. `1.2.34`
2. commit the version file: `git commit VERSION`
3. tag this latest commit for future reference: `git tag v1.2.34`
4. push this commit and the tag to Github:
   `git push origin release/stoat --tags`
5. build and package up the extension for upload to the
   [Chrome Dashboard](https://chrome.google.com/webstore/developer/dashboard)
   using `make release`

