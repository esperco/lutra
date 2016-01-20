This directory contains all of the front-end code hosted at esper.com.

Prerequisites
-------------

For production builds, you'll need to install `s3tools` to upload to
Amazon S3. On a Mac, this is:
```
brew install s3cmd
```

Obtain your personal access keys from the AWS console. The secret key
is personal and can be downloaded only once.

Give the S3 access keys to s3cmd:
```
s3cmd --configure
```

Now you are set up for uploading files to S3 using `s3cmd`.

Development Build
-----------------

Call `make` to build the entire site and place in the `pub/` directory. This
allows you to check locally what the site looks like before going live.

Call `make watch` to launch a development server at `localhost:5000`.

Production Release
------------------

Merge the commits for release into the `release/esper.com` branch. Once the 
branch is usable and a candidate for a release, call `make install`.
