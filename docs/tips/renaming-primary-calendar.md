---
comments: true
date: 2019-05-22
slug: renaming-primary-calendar
tags:
- google
- calendar
- apps-for-business
- custom-domain
title: Renaming Primary Google Calendar for Apps for Business
---

**TL;DR** Look at the section [Step-by-Step](#step-by-step) for the solution
about the immutable primary calendar name on Google Apps accounts.

I have been a Google Apps user for a long time. It began when Google announced
Gmail for the custom domain as a free service. It let me use gmail with my own
domain. It was fantastic at the beginning.

Then, as you are aware of, Google abandoned it for free users. They added newly
released services such as Project Fi (now Google Fi), Inbox (already dead) to
`@gmail.com` account first and took long time to be available on Google Apps
account. Also, doesn't have to mention that Google stopped accepting new free
accouts for Google Apps and changed the name to Google Apps Basic, limiting the
max user to 5. And they have prevented the free user from changing the primary
domain as it can be used for trading purpose. The free account was quite popular
on the market. Preventing the change of primary domain blocked the possiblity of
ownership transfer.

I changed my email address couple of times, beginning from `ekim@eunchan.net` to
`kim@eunchan.net` then `me@eunchan.kim` after purchasing the new domain. And
I found that the calendar notification email showed always `ekim@eunchan.net`
and also on my Apple Calendar App too.

![Wrong calendar name in Apple Calendar App](../media/page/tips/primary-calendar-issue1.png)

I've tried changing the main calendar name from the calendar web interface, but
didn't help. At the time, I wasn't using Google Apps for Business (subscription)
yet, so there was no way to get in contact with the customer service. After
couple of tries, I literally gave up. And Android calendar app also began
showing same issue.

![Wrong calendar name in Android Calendar App](../media/page/tips/primary-calendar-issue2.png)

Then after switching to the purchased service, Google Apps for Business couple
of years later, I contacted the customer service to get this resolved. After
almost 9 months of discussing, analyzing, and giving the logs, then eventually
they gave me the solution. In the middle of it, they also suggested me to delete
the account and re-create with same name that I never tried as I have much of
purchase history in the account.

In short, it cannot be solved with Calendar WebUI nor App UI on Android or macOS
at all. Users should visit **APIs Explorer** to remove the redundant config
field, `summaryOverride`.

## Step-by-Step

Make sure you are logged into the account having the issue. For instance,
foo@bar.com

1.  Go to [Google APIs
    Explorer](https://developers.google.com/apis-explorer/#s/calendar/v3/calendar.calendarList.get)
2.  Type `primary` in `calendarId` field and click *Authorize*. You may have to
    accept or authorize the API to access your account if it is first time to
    use.

    ![Log in to APIs Explorer](../media/page/tips/primary-calendar-step1.png)

    ![Log in to APIs Explorer](../media/page/tips/primary-calendar-step2.png)

3.  You should get `Response` section below. Click on the arrow in `kind` field
    and select `calendar.calendarList.update`.

    ![Authorize](../media/page/tips/primary-calendar-step3.png)

    ![calendarList.update](../media/page/tips/primary-calendar-step4.png)

4.  Copy in the calendarId block what's in the eid field. It should be same as
    your google account such as `foo@bar.com`.

    ![calendarId](../media/page/tips/primary-calendar-step5.png)

5.  Click the `x` button from the `summaryOverride` field. Then the field will
    be removed. This has the value of your old email address.

    ![Remove `summaryOverride`](../media/page/tips/primary-calendar-step6.png)

6.  Click authorize to update the values.