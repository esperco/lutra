HoneyBadger doesn't care, but in this case, this directory contains
the files to run the front-end Esper website.

Prerequisites
-------------

Install `s3tools`:
```
brew install s3tools  # Mac
```

Obtain your personal access keys from the AWS console. The secret key
is personal and can be downloaded only once.

Give the S3 access keys to s3cmd:
```
s3cmd --configure
```

Now you are set up for uploading files to S3 using `s3cmd`.
