App.constant('RedditConfig', {
        clientID: '_OiiEDnIKbwbOg',
        scope: 'privatemessages,identity,submit',
        redirectUri: 'https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb'
    })
    .service('RedditService', ['RedditConfig', function (RedditConfig) {
        var me = this;

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
                }
                promise = $.Deferred();

            chrome.identity.launchWebAuthFlow(options, function (rUri) {
                if (!rUri) {
                    promise.reject('Invalid redirectUri', rUri);
                }

                var parser = $('<a></a>').attr('href', rUri)[0],
                    query = parseQueryString(parser.search.substr(1));

                if (chrome.runtime.lastError) {
                    promise.reject(chrome.runtime.lastError);
                }

                if (query.state !== state) {
                    promise.reject('Invalid state');
                }

                if (!query.code) {
                    promise.reject('Invalid code');
                }

                promise.resolve(query.code);
            });

            return promise;
        }

        function getAccessToken(oauthCode) {
            return $.ajax({
                url: 'https://ssl.reddit.com/api/v1/access_token',
                type: 'POST',
                headers: {
                    Authorization: 'Basic ' + window.btoa(RedditConfig.clientID + ':')
                },
                data: {
                    grant_type: 'authorization_code',
                    code: oauthCode,
                    redirect_uri: RedditConfig.redirectUri
                }
            }).then(function (data) {
                RedditConfig.accessToken = data.access_token;
                RedditConfig.refreshToken = data.refresh_token;

                return data.expires_in * 1000;
            });
        }

        function refreshAccessToken() {
            return $.ajax({
                url: 'https://ssl.reddit.com/api/v1/access_token',
                type: 'POST',
                headers: {
                    Authorization: 'Basic ' + window.btoa(RedditConfig.clientID + ':')
                },
                data: {
                    grant_type: 'refresh_token',
                    refresh_token: RedditConfig.refreshToken
                }
            }).then(function (data) {
                RedditConfig.accessToken = data.access_token;

                setTimeout(refreshAccessToken, data.expires_in * 1000);
            });
        }

        function getUserInfo() {
            return $.ajax({
                url: 'https://oauth.reddit.com/api/v1/me',
                type: 'GET',
                headers: {
                    Authorization: 'bearer ' + RedditConfig.accessToken
                }
            }).then(function (data) {
                RedditConfig.username = data.name;
                RedditConfig.userID = data.id;
            });
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
                        getUserInfo();
                    });
            },
            getInboxMessages: function (config) {
                return $.ajax({
                    url: 'https://oauth.reddit.com/message/inbox',
                    type: 'GET',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken
                    },
                    data: _.extend({
                        mark: false,
                        limit: 25
                    }, config)
                }).then(function (data) {
                    return data.data;
                });
            },
            getUnreadMessages: function (config) {
                return $.ajax({
                    url: 'https://oauth.reddit.com/message/unread',
                    type: 'GET',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken
                    },
                    data: _.extend({
                        mark: false,
                        limit: 25
                    }, config)
                }).then(function (data) {
                    return data.data;
                });
            },
            getSentMessages: function (config) {
                return $.ajax({
                    url: 'https://oauth.reddit.com/message/sent',
                    type: 'GET',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken
                    },
                    data: _.extend({
                        mark: false,
                        limit: 25
                    }, config)
                }).then(function (data) {
                    return data.data;
                });
            },
            markMessageAsRead: function (messageID) {
                return $.ajax({
                    url: 'https://oauth.reddit.com/api/read_message',
                    type: 'POST',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken
                    },
                    data: {
                        id: messageID
                    }
                });
            },
            markMessageAsUnread: function (messageID) {
                return $.ajax({
                    url: 'https://oauth.reddit.com/api/unread_message',
                    type: 'POST',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken
                    },
                    data: {
                        id: messageID
                    }
                });
            },
            postReplyMessage: function (replyToID, messageText) {
                return $.ajax({
                    url: 'https://oauth.reddit.com/api/comment',
                    type: 'POST',
                    headers: {
                        Authorization: 'bearer ' + RedditConfig.accessToken
                    },
                    data: {
                        api_type: 'json',
                        text: messageText,
                        thing_id: replyToID
                    }
                }).then(function (data) {
                    return data.json.data.things;
                });
            }
        });
    }]);