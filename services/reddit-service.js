App.constant('RedditConfig', {
        clientID: '_OiiEDnIKbwbOg',
        scope: 'privatemessages,identity,submit',
        redirectUri: 'https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb'
    })
    .service('RedditService', ['RedditConfig', '$http', '$q', function (RedditConfig, $http, $q) {
        var me = this,
            prevCaptchaObjectUrl = null;

        function getCaptchaImage(iden) {
            deferred = $q.defer();

            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        prevCaptchaObjectUrl = window.URL.createObjectURL(xhr.response);
                        deferred.resolve({
                            iden: iden,
                            imgSrc: prevCaptchaObjectUrl
                        });
                    }
                    else {
                        deferred.reject();
                    }
                }
            };
            xhr.responseType = 'blob';
            xhr.open('GET', 'https://oauth.reddit.com/captcha/' + iden, true);
            xhr.setRequestHeader('Authorization', 'bearer ' + RedditConfig.accessToken);
            xhr.send();

            return deferred.promise;
        }

        _.extend(me, {
            getUserInfo: function () {
                return $http({
                    url: 'https://oauth.reddit.com/api/v1/me',
                    method: 'GET'
                }).then(function (resp) {
                    RedditConfig.username = resp.data.name;
                    RedditConfig.userID = resp.data.id;
                });
            },
            getInboxMessages: function (config) {
                return $http({
                    url: 'https://oauth.reddit.com/message/inbox',
                    method: 'GET',
                    params: _.extend({
                        mark: false,
                        limit: 25
                    }, config)
                }).then(function (resp) {
                    return resp.data.data;
                });
            },
            getUnreadMessages: function (config) {
                return $http({
                    url: 'https://oauth.reddit.com/message/unread',
                    method: 'GET',
                    params: _.extend({
                        mark: false,
                        limit: 25
                    }, config)
                }).then(function (resp) {
                    return resp.data.data;
                });
            },
            getSentMessages: function (config) {
                return $http({
                    url: 'https://oauth.reddit.com/message/sent',
                    method: 'GET',
                    params: _.extend({
                        mark: false,
                        limit: 25
                    }, config)
                }).then(function (resp) {
                    return resp.data.data;
                });
            },
            markMessageAsRead: function (messageID) {
                return $http({
                    url: 'https://oauth.reddit.com/api/read_message',
                    method: 'POST',
                    data: $.param({
                        id: messageID
                    })
                });
            },
            markMessageAsUnread: function (messageID) {
                return $http({
                    url: 'https://oauth.reddit.com/api/unread_message',
                    method: 'POST',
                    data: $.param({
                        id: messageID
                    })
                });
            },
            postReplyMessage: function (replyToID, messageText) {
                return $http({
                    url: 'https://oauth.reddit.com/api/comment',
                    method: 'POST',
                    data: $.param({
                        api_type: 'json',
                        text: messageText,
                        thing_id: replyToID
                    })
                }).then(function (resp) {
                    return resp.data.json.data.things;
                });
            },
            getCaptcha: function (iden) {
                if (!!prevCaptchaObjectUrl) {
                    window.URL.revokeObjectURL(prevCaptchaObjectUrl);
                }

                if (!!iden) {
                    // No identity provided, get one then get the image
                    return $http({
                        url: 'https://oauth.reddit.com/api/new_captcha',
                        method: 'POST',
                        data: $.param({
                            api_type: 'json'
                        })
                    }).then(function (resp) {
                        return getCaptchaImage(resp.data.json.data.iden);
                    });
                }
                else {
                    // Use the provided identity to get the image
                    return getCaptchaImage(iden);
                }
            },
            postNewMessage: function (config) {
                return $http({
                    url: 'https://oauth.reddit.com/api/compose',
                    method: 'POST',
                    data: $.param(_.extend({
                        api_type: 'json'
                    }, config))
                }).then(function (resp) {
                    deferred = $q.defer();

                    if (resp.data.json.errors.length > 0) {
                        deferred.reject({
                            iden: resp.data.json.captcha
                        });
                    }
                    else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                });
            }
        });
    }]);