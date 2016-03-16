This directory contains all of the front-end code hosted at esper.com.

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

Development Build
-----------------

Call `make` to build the entire site and place in the `pub/` directory. This
allows you to check locally what the site looks like before going live.

Call `make watch` to launch a development server at `localhost:5000`.

Production Release
------------------

Merge the commits for release into the `release/esper.com` branch. Once the
branch is usable and a candidate for a release, call `make staging` to first
deploy to https://staging.esper.com/. If everything is fine on staging,
deploy to production with `make install`.

Tag with the date and push back to origin:

```
git tag 20160316
git push origin release/esper.com --tags
```
