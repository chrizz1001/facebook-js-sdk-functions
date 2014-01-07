facebook-js-sdk-functions
=========================

facebook on page functions

*Required global JS Vars:
- club_name (for album name)
- appId (the facebook app id)


Usage:

Selectors:

.fb-invite
- attributes in Link needed: data-eventid, data-title

.fb-share
- attributes in Link needed: data-eventid, data-title, data-pic, data-text

.fb-attend
- attributes in Link needed: data-eventid

.pp_share, .fb-pic-upload
pretty photo connection

        var uri = $('#fullResImage').attr('src'), // image uri
            title = $('.ppt').eq(0).text(); // image title
