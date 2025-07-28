---
date: 2019-10-06
comments: true
tags: ['google', 'cloud-storage', 'rsync', 'restore', 'backup']
language: en
slug: 'gsutil-error'
---

# gcloud storage error

Again, I made a mistake.

This is probably second time or third. I cannot remember the detail what happend
previsouly. But this mistake makes me feel dumb.

I recently installed Windows to my quite old desktop as I try to ditch my work
laptop on my website build. So, it was natural to install WSL (Window Subsystem
Linux) to my desktop and install the relavent tools. I have a setup script to
install all the necessary tools and setup my environment. Ran it and boom! All
things were ready.

My website uses Haskell to build, and all the media files are stored in Google
Cloud Storage bucket. The script downloads all the media from the Google cloud
storage and prepares sync script too. The sync is basically rsync-like script
that is provided by Google through google-cloud-sdk. It worked flawlessly when I
download the media files into my local machine.

Then, when I sync again with the script, it deleted all media from my local
directory and also the cloud storage bucket too. Maybe the date of the directory
was wrong. But still cannot figure out why files in both locations were deleted.

Fortunately, I have a backup but the images of recent posts were gone. Cannot
recover those files, as I already deleted those files from my work laptop.
At first, I blamed the google-cloud-sdk tool that doesn't manage file history
well. Later, I now understand it is my fault that didn't backup before try it. I
should've backup the local before doing it as it is new machine and new setup.

Anyway, please let me know any missing images if you found. I will try my best
to find or re-create the images.

_Updated @ 10/08: Now most of the images are recovered_
