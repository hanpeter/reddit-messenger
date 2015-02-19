App.constant('RedditConfig', {
        clientID: '_OiiEDnIKbwbOg',
        scope: 'privatemessages,identity,submit',
        redirectUri: 'https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb'
    })
    .service('RedditService', ['RedditConfig', '$http', '$q', function (RedditConfig, $http, $q) {
        var me = this,
            prevCaptchaObjectUrl = null;

        function generateURL(baseUrl, params) {
            return baseUrl + '?' + _.reduce(_.map(params, function (value, key) { return key + '=' + value; }), function (memo, value) { return memo + '&' + value; });
        }

        function randomStateGenerator(numChar) {
            return new Array(numChar + 1).join('x').replace(/[x]/g, function(c) {
                return (Math.random()*16|0).toString(16);
            });
        }

        function parseQueryString(query) {
            var map = _.map(query.split('&'), function (value) {
                    var obj = {},
                        split = value.split('=');

                    obj[split[0]] = split[1];
                    return obj;
                });

            return _.reduce(map, function (memo, value) { return _.extend(memo, value); });
        }

        function getOAuthToken() {
            var state = randomStateGenerator(20),
                params = {
                    client_id: RedditConfig.clientID,
                    response_type: 'code',
                    state: state,
                    redirect_uri: encodeURIComponent(RedditConfig.redirectUri),
                    duration: 'permanent',
                    scope: RedditConfig.scope
                },
                options = {
                    interactive: true,
                    url: generateURL('https://ssl.reddit.com/api/v1/authorize', params)
                },
                deferred = $q.defer();

            chrome.identity.launchWebAuthFlow(options, function (rUri) {
                if (!rUri) {
                    deferred.reject('Invalid redirectUri', rUri);
                }

                var parser = $('<a></a>').attr('href', rUri)[0],
                    query = parseQueryString(parser.search.substr(1));

                if (chrome.runtime.lastError) {
                    deferred.reject(chrome.runtime.lastError);
                }

                if (query.state !== state) {
                    deferred.reject('Invalid state');
                }

                if (!query.code) {
                    deferred.reject('Invalid code');
                }

                deferred.resolve(query.code);
            });

            return deferred.promise;
        }

        function getAccessToken(oauthCode) {
            return $http({
                url: 'https://ssl.reddit.com/api/v1/access_token',
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + window.btoa(RedditConfig.clientID + ':'),
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                data: $.param({
                    grant_type: 'authorization_code',
                    code: oauthCode,
                    redirect_uri: RedditConfig.redirectUri
                })
            }).then(function (resp) {
                RedditConfig.accessToken = resp.data.access_token;
                RedditConfig.refreshToken = resp.data.refresh_token;

                return resp.data.expires_in * 1000;
            });
        }

        function refreshAccessToken() {
            return $http({
                url: 'https://ssl.reddit.com/api/v1/access_token',
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + window.btoa(RedditConfig.clientID + ':'),
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                data: $.param({
                    grant_type: 'refresh_token',
                    refresh_token: RedditConfig.refreshToken
                })
            }).then(function (resp) {
                RedditConfig.accessToken = resp.data.access_token;

                setTimeout(refreshAccessToken, resp.data.expires_in * 1000);
            });
        }

        function getUserInfo() {
            return $http({
                url: 'https://oauth.reddit.com/api/v1/me',
                method: 'GET',
                headers: {
                    Authorization: 'bearer ' + RedditConfig.accessToken,
                    'Content-type': 'application/x-www-form-urlencoded'
                }
            }).then(function (resp) {
                RedditConfig.username = resp.data.name;
                RedditConfig.userID = resp.data.id;
            });
        }

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
            getToken: function () {
                if (chrome.runtime.id !== 'dbdabkkhkmahpcihjdkacnkbofblmgcp') {
                    RedditConfig.clientID = 'NFcMPd6TpSQkdA';
                }

                return getOAuthToken()
                    .then(getAccessToken)
                    .then(function (expirationTime) {
                        setTimeout(refreshAccessToken, expirationTime);
                    })
                    .then(getUserInfo);
            },
            getInboxMessages: function (config) {
                return $http({
                    url: 'https://oauth.reddit.com/message/inbox',
                    method: 'GET',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
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
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
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
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
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
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
                    data: $.param({
                        id: messageID
                    })
                });
            },
            markMessageAsUnread: function (messageID) {
                return $http({
                    url: 'https://oauth.reddit.com/api/unread_message',
                    method: 'POST',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
                    data: $.param({
                        id: messageID
                    })
                });
            },
            postReplyMessage: function (replyToID, messageText) {
                return $http({
                    url: 'https://oauth.reddit.com/api/comment',
                    method: 'POST',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
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
                        headers: {
                            Authorization: 'bearer ' + RedditConfig.accessToken,
                            'Content-type': 'application/x-www-form-urlencoded'
                        },
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
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken,
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
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