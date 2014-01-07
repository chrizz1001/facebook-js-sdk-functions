/**
 * Event Invite Buttons
 */
$(document).delegate('.fb-invite', 'click', function (e) {

    e.preventDefault();

    var eventid = $(this).data('eventid'),
        eventTitle = $(this).data('title');

    nlm_fb_event.invite(eventid, eventTitle, function (aFriends) {
        payInvitations(aFriends);
    });

    return false;
});

/**
 * Event Share Buttons
 */
$(document).delegate('.fb-share', 'click', function (e) {

    e.preventDefault();

    var eventid = $(this).data('eventid'),
        eventTitle = $(this).data('title'),
        eventText = $(this).data('text'),
        eventpic = $(this).data('pic');

    nlm_fb_event.share(eventid, eventTitle, eventText, eventpic, function (data) {
    });

    return false;
});

/**
 * Event Attend Buttons
 */
$(document).delegate('.fb-attend', 'click', function (e) {

    e.preventDefault();

    var eventid = $(this).data('eventid'),
        toDelete = this;

    nlm_fb_event.attend(eventid, function (data) {
        $(toDelete).remove();
    });

    return false;
});

var fbUploading = false;

$(document).delegate('.pp_share, .fb-pic-upload', 'click', function (e) {

    e.preventDefault();

    if (!fbUploading) {

        fbUploading = true;
        $(this).addClass('disabled');
        $(this).attr('disabled', true);

        var uri = $('#fullResImage').attr('src'),
            title = $('.ppt').eq(0).text();

        nlm_fb_gallery.upload(uri, title, club_name, function (answer) {

            fbUploading = false;
            $(this).removeClass('disabled');
            $(this).attr('disabled', false);

            alert('Das Foto wurde in dein Facebook Fotoalbum hoch geladen');

        });
    }
});

/**
 * load Facebook and init
 */
$(document).ready(function () {

    // async facebook file load
    var js, id = 'facebook-jssdk', ref = document.getElementsByTagName('script')[0];
    if (document.getElementById(id)) {
        return;
    }
    js = document.createElement('script');
    js.id = id;
    js.async = true;
    js.src = "//connect.facebook.net/de_DE/all.js";
    ref.parentNode.insertBefore(js, ref);

    // hide non fb events
    $('[data-eventid=""]').remove();
});

/**
 * async facebook initiation
 */
window.fbAsyncInit = function () {

    FB.init({
        appId: appId, // App ID
        channelUrl: '//dejavue-versmold.de/channel.php',
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse XFBML
        oauth: true
    });

    $('.fb-attend').each(function () {
        var $btn = $(this),
            event_id = $btn.data('eventid');

        nlm_fb_event.me_attending(event_id, function (data) {
            if (typeof data[0] != 'undefined') {
                if (data[0].rsvp_status == 'attending') {
                    $btn.remove();
                }
            }
        });
    });
};


/**
 * friends invitation calculation
 * @param aFriends
 */
function payInvitations(aFriends) {

    if (aFriends) {
        var add = 0,
            alreadyThere = 0,
            count = 0;

        function countInvitePoints(resp) {
            if (resp.result.add) {
                add += resp.result.add;
            }
            else {
                alreadyThere++;
            }
            count++;

            if (count == aFriends.length) {
                text = 'Für ' + count + ' Freunde wurden dir ' + add + ' Punkte gut geschrieben';

                if (alreadyThere > 0) {
                    text = text + '. Für ' + alreadyThere + ' Freunde gab es keine Punkte weil du sie schon eingeladen hast';
                }

                $(pageDataData.pointsSelector).html(resp.result.total);

                printAlert(text);
            }
        }

        for (var i in aFriends) {

            $.ajax({
                url: '/api/json/?request=user&action=points&type=invite&singleUseParam=' + eventid + '_' + aFriends[i],
                dataType: 'json',
                success: function (data) {
                    countInvitePoints(data);
                }
            });

        }
    }
}


/**
 * Alert text to user
 * @param text
 */
function printAlert(text) {
    alert(text);
}

/**
 * facebook actions for club events (share, attend, read attendees
 * @type {{attending: Function, append_attendees: Function, attend: Function, action_invite: Function, invite: Function, share: Function}}
 */
var nlm_fb_event = {

    /**
     * facebook action for reading event attendees
     * @param eventid the facebook event id
     * @param callback the callback function (for data processing)
     */
    attending: function (eventid, callback, limit) {

        if (!limit) {
            limit = '';
        }
        var fql = 'SELECT uid, name FROM user WHERE uid in (SELECT uid FROM event_member WHERE eid=' + eventid + ') ' + limit;

        FB.api(
            {
                method: 'fql.query',
                query: fql,
                access_token: app_access_token
            },
            function (data) {
                callback(data);
            }
        );
    },

    /**
     * read event attendees and append them to a template
     * @param eventid
     * @param template
     */
    append_attendees: function (eventid, template, limit) {
        var parent = template.parent(), t = template.parent().find('.template').clone(true, true);

        parent.empty();
        parent.children(':not(.template)').remove();

        nlm_fb_event.attending(eventid, function (response) {

            $('[data-fb-event="' + eventid + '"] .event-facebook-attendeeCount').text(response.length);

            for (var i in response) {
                if (typeof response[i].uid != "undefined") {
                    var cln = t.clone(true, true);

                    cln.find('[href]').each(function () {
                        $(this).attr('href', 'https://www.facebook.com/' + response[i].uid)
                    });
                    cln.find('[title]').each(function () {
                        $(this).attr('title', response[i].name)
                    });
                    cln.find('[alt]').each(function () {
                        $(this).attr('alt', response[i].name)
                    });
                    cln.find('[src]').each(function () {
                        $(this).attr('src', 'https://graph.facebook.com/' + response[i].uid + '/picture')
                    });
                    cln.css('display', 'inline-block');
                    cln.removeClass('template');
                    cln.show();

                    parent.append(cln);

                    if (access.userdata) {
                        if (response[i].uid == access.userdata.result.facebook.customer_id) {
                            $('[data-fb-event="' + eventid + '"] .btn-facebook-attend').addClass('disabled').click(function (e) {
                                e.preventDefault;
                            });
                        }
                    }
                }
            }
        }, limit);

    },

    /**
     * user attends to an event
     * @param eventid facebook event id
     * @param callback callback function (eg. for point subscription
     */
    attend: function (eventid, callback) {
        FB.getLoginStatus(function (response) {

            if (response.status === 'connected') {

                window.FB.api(eventid + '/attending', 'post', {}, function (response) {
                    if (response.error) {
                        callback('error');
                    }
                    if (response === true) {
                        callback('success');
                    }
                });
            } else if (response.status === 'not_authorized') {
                callback('auth_error');
            } else {
                callback('auth_error');
            }
        });
    },

    /**
     * facebook action for inviting facebook friends to an event
     * @param eventid facebook event ID
     * @param aFriends guys to invite
     * @param callback calback for points
     */
    action_invite: function (eventid, aFriends, callback) {

        FB.getLoginStatus(function (response) {
            if (response.status === 'connected') {
                FB.api({ 'method': 'events.invite',
                        'eid': eventid,
                        'uids': aFriends,
                        'access_token': response.authResponse.accessToken
                    }, function () {
                        callback(aFriends);
                    }
                );

            } else if (response.status === 'not_authorized') {
                // the user is logged in to Facebook,
                // but has not authenticated your app
            } else {
                // the user isn't logged in to Facebook.
            }
        });

    },

    /**
     * invite people to an event
     * @param eventid facebook event ID
     * @param title text of the invitation
     * @param callback a callback for points
     */
    invite: function (eventid, title, callback) {
        FB.ui({method: 'apprequests',
            message: title
        }, function (response) {

            if (response) {
                nlm_fb_event.action_invite(eventid, response.to, callback);
            }
        });
    },

    /**
     * share an event on facebook walls
     * @param eventid facebook event id
     * @param title title of the event
     * @param text text of the event
     * @param picUrl relative url to an event image
     * @param callback callback funtion for points
     */
    share: function (eventid, title, text, picUrl, callback) {
        var baseUrl = window.location.protocol + '//' + window.location.host;
        var obj = {
            method: 'feed',
            redirect_uri: baseUrl,
            link: 'https://www.facebook.com/events/' + eventid + '/',
            picture: baseUrl + picUrl,
            name: title,
            caption: text,
            description: text
        };

        FB.ui(obj, callback);
    },

    /**
     * facebook action for reading event attendees
     * @param eventid the facebook event id
     * @param callback the callback function (for data processing)
     */
    me_attending: function (eventid, callback) {

        var fql = 'SELECT rsvp_status FROM event_member WHERE eid=' + eventid + ' AND uid = ' + FB.getUserID();

        FB.api(
            {
                method: 'fql.query',
                query: fql,
                access_token: app_access_token
            },
            function (data) {
                callback(data);
            }
        );
    }
};
/**
 * functions for facebook connection and the gallery
 * @type {{share: Function, upload: Function, actionUpload: Function}}
 */
var nlm_fb_gallery = {

    /**
     * call to facebook jssdk for sharing a gallery
     * @param galleryTitle title to be shown on facebook
     * @param galleryPic relative url to the image
     * @param galleryLink relative url to the gallery
     * @param callback callback function after facebook (for giving the user points for sharing etc.)
     */
    share: function (galleryTitle, galleryPic, galleryLink, callback) {
        var baseUrl = window.location.protocol + '//' + window.location.host;

        var obj = {
            method: 'feed',
            link: baseUrl + galleryLink,
            picture: baseUrl + '/' + galleryPic,
            name: galleryTitle,
            caption: galleryTitle,
            description: galleryTitle
        };

        FB.ui(obj, callback);
    },

    /**
     * upload a image to facebook album
     * @param url relative url to the image
     * @param msg message to be shown next to the image on facebook
     * @param albumName the album name to be posted in
     * @param callback callback function after facebook (for giving the user points for sharing etc.)
     */
    upload: function (url, msg, albumName, callback) {

        if (!albumName) {
            albumName = fbAlbumName;
        }

        FB.getLoginStatus(function (response) {
//            if (response.status === 'connected') {

            var fql = 'SELECT object_id FROM album WHERE owner=me() AND name="' + albumName + '"';

            FB.api(
                {
                    method: 'fql.query',
                    query: fql,
                    access_token: response.authResponse.accessToken
                },
                function (data) {
                    if (data.length > 0) {
                        nlm_fb_gallery.actionUpload(data[0].object_id, url, msg, callback, response.authResponse.accessToken);

                    }
                    else {
                        FB.api('/me/albums', 'post', {
                            name: albumName,
                            message: albumName
                        }, function (answer) {
                            nlm_fb_gallery.actionUpload(answer.id, url, msg, callback, response.authResponse.accessToken);
                        });
                    }
                }
            );

            return false;
        });
    },

    /**
     * upload a pic to facebook
     * @param albumId id of the facebook album (must exsist!)
     * @param url relative url to the image
     * @param msg message to be shown next to the image
     * @param callback
     * @param at facebook access_token
     * @returns {boolean} always think positive
     */
    actionUpload: function (albumId, url, msg, callback, at) {

        var baseUrl = window.location.protocol + '//' + window.location.host;

        FB.api(albumId + '/photos', 'post', {
            message: msg,
            access_token: at,
            url: baseUrl + '/' + url
        }, function (answer) {
            callback(answer);
        });

        return true;
    }
};