In most cases, HoneyBadger doesn't care. In this case, this directory contains
the files to run the front-end Esper website (including our jobs page, privacy policy, contact us, etc.)

Prerequisites
-------------

Install `s3tools`. On a Mac, this is:
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
