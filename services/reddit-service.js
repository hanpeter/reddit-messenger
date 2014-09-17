App.service('RedditService', [function () {
    var me = this,
        redirectUri = 'https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb';

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
                client_id: '_OiiEDnIKbwbOg',
                response_type: 'code',
                state: state,
                redirect_uri: encodeURIComponent(redirectUri),
                duration: 'permanent',
                scope: 'privatemessages,identity'
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
            dataType: 'JSON',
            contentType: 'application/x-www-form-urlencoded;charset=utf-8',
            headers: {
                Authorization: 'Basic ' + window.btoa('_OiiEDnIKbwbOg' + ':' + 'QnJs4dIkJeVKCdo-kGQImw2ftlA')
            },
            data: {
                grant_type: 'authorization_code',
                code: oauthCode,
                redirect_uri: redirectUri
            }
        }).then(function (data) {
            me.accessToken = data.access_token;
            me.refreshToken = data.refresh_token;

            return data.expires_in * 1000;
        });
    }

    function refreshAccessToken() {
        return $.ajax({
            url: 'https://ssl.reddit.com/api/v1/access_token',
            type: 'POST',
            dataType: 'JSON',
            contentType: 'application/x-www-form-urlencoded;charset=utf-8',
            headers: {
                Authorization: 'Basic ' + window.btoa('_OiiEDnIKbwbOg' + ':' + 'QnJs4dIkJeVKCdo-kGQImw2ftlA')
            },
            data: {
                grant_type: 'refresh_token',
                refresh_token: me.refreshToken
            }
        }).then(function (data) {
            me.accessToken = data.access_token;

            setTimeout(refreshAccessToken, data.expires_in * 1000);
        });
    }

    _.extend(me, {
        userName: 'dppsub2',
        getToken: function () {
            return getOAuthToken().then(getAccessToken).done(function (expirationTime) {
                setTimeout(refreshAccessToken, expirationTime);
            });
        },
        getInboxMessages: function () {
            return $.ajax({
                url: 'https://oauth.reddit.com/message/inbox',
                type: 'GET',
                dataType: 'JSON',
                contentType: 'application/json',
                headers: {
                    Authorization: 'bearer ' + me.accessToken
                },
                data: {
                    mark: false,
                    limit: 25
                }
            }).then(function (data) {
                return data.data;
            });
        },
        getUnreadMessages: function () {
            return $.ajax({
                url: 'https://oauth.reddit.com/message/unread',
                type: 'GET',
                dataType: 'JSON',
                contentType: 'application/json',
                headers: {
                    Authorization: 'bearer ' + me.accessToken
                },
                data: {
                    mark: false,
                    limit: 25
                }
            }).then(function (data) {
                return data.data;
            });
        },
        getSentMessages: function () {
            return $.ajax({
                url: 'https://oauth.reddit.com/message/sent',
                type: 'GET',
                dataType: 'JSON',
                contentType: 'application/json',
                headers: {
                    Authorization: 'bearer ' + me.accessToken
                },
                data: {
                    mark: false,
                    limit: 25
                }
            }).then(function (data) {
                return data.data;
            });
        }
    });
}]);