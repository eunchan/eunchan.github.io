----
title: Archlinux as Home Server
date: April 6, 2012
public: true
----

Initial Setting
---------------

### Hostname

    HOSTNAME in */etc/rc.conf*

### Showing UTF-8 Character

    alias ls='ls --color=auto --show-control-chars'

### Locale

    /etc/rc.conf

    LOCALE=ko_KR.UTF-8

    localedef 

Install Packages
----------------

    pacman -S nginx trac python2 samba mercurial virtualenv2 vim postgresql

Samba
-----

- */etc/samba/conf/smb.conf* 수정
- *smbpasswd* 를 이용해서 계정 비밀번호 생성

PostgreSQL
----------

    rc.d start postresql
    sudo -i -u postgres
    createuser -U postgres
    psql template1
    >>> CREATE USER <username> WITH PASSWORD 'password' CREATE ROLE;
    createdb -O <username> -T template0 <db_name>

Django
------

    virtualenv2 .virtualenv
    source .virtualenv/bin/activate
    pip install django flup markdown <what-you-want-to-install>
    django-admin.py startproject <project_name>
    cd <project_name>
    ./manage.py startapp <app_name>
    ./manage.py runfcgi --port=8080

NGINX
------

    /etc/nginx/conf/nginx.conf 수정

Fail2ban
---------

To block the host that tries malicious login requests, install fail2ban and activate ssh-iptables

    vim /etc/rc.conf
    add fail2ban and iptables

    vim /etc/fail2ban/jain.conf
    make enable true in [sshd-iptables]
    log path = /var/log/auth.log

MTA mail
--------

1.  Only for sending mails to others, I setup msmtp::

        pacman -S msmtp-mta

2.  edit /etc/mail.rc

        set sendmail=/usr/sbin/msmtp

3.  edit ~/.msmtprc  for gmail

        # Accounts will inherit settings from this section
        defaults
        auth             on
        tls              on
        tls_trust_file   /usr/share/ca-
        ertificates/mozilla/Thawte_Premium_Server_CA.crt
        
        # A first gmail address
        account        gmail
        host           smtp.gmail.com
        port           587
        from           username@gmail.com
        user           username@gmail.com
        password       password
        
        # A second gmail address
        account    gmail2 : gmail
        from       username2@gmail.com
        user       username2@gmail.com
        password   password2
        # It looks like Google's in the process of becoming its own certificate
        # authority. For some users, they seem to have switched to a "Google
        # Certificate Authority" certificate, which is rooted in Equifax.
        #tls_trust_file /usr/share/ca-certificates/mozilla/Equifax_Secure_CA.crt
        
        # A freemail service
        account    freemail
        host       smtp.freemail.example
        from       joe_smith@freemail.example
        user       joe.smith
        password   secret
        
        # A provider's service
        account   provider
        host      smtp.provider.example
        
        # Set a default account
        account default : gmail

4.  And make it secure

        chmod 600 ~/.msmtprc
