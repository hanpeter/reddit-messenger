App.service('AuthorizationService', ['$q', 'RedditConfig', function ($q, RedditConfig) {
    var me = this,
        expireTime = moment();

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
        var state = randomStateGenerator(20);
        var deferred = $q.defer();

        if (chrome.runtime.id !== 'dbdabkkhkmahpcihjdkacnkbofblmgcp') {
            RedditConfig.clientID = 'NFcMPd6TpSQkdA';
        }
        var params = {
                client_id: RedditConfig.clientID,
                response_type: 'code',
                state: state,
                redirect_uri: encodeURIComponent(RedditConfig.redirectUri),
                duration: 'permanent',
                scope: RedditConfig.scope
            };
        var options = {
                interactive: true,
                url: generateURL('https://ssl.reddit.com/api/v1/authorize', params)
            };

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

            RedditConfig.oauthCode = query.code;
            deferred.resolve(query.code);
        });

        return deferred.promise;
    }

    function getAccessToken() {
        return $.ajax({
            url: 'https://ssl.reddit.com/api/v1/access_token',
            type: 'POST',
            headers: {
                Authorization: 'Basic ' + window.btoa(RedditConfig.clientID + ':')
            },
            data: {
                grant_type: 'authorization_code',
                code: RedditConfig.oauthCode,
                redirect_uri: RedditConfig.redirectUri
            }
        }).then(function (data) {
            RedditConfig.accessToken = data.access_token;
            RedditConfig.refreshToken = data.refresh_token;

            expireTime = moment().add(data.expires_in, 's');
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

            expireTime = moment().add(data.expires_in, 's');
        });
    }

    function setAuthorization(config) {
        config.headers.Authorization = 'bearer ' + RedditConfig.accessToken;
        return config;
    }

   _.extend(me, {
        request: function (config) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if (config.url.indexOf('https://oauth.reddit.com') > -1) {
                if (!RedditConfig.oauthCode) {
                    promise = promise.then(getOAuthToken);
                }

                if (!RedditConfig.refreshToken) {
                    promise = promise.then(getAccessToken);
                }
                else if (moment().isAfter(expireTime)) {
                    promise = promise.then(refreshAccessToken);
                }

                promise = promise.then(function () {
                    return setAuthorization(config);
                });
            }
            else {
                promise = promise.then(function () {
                    return config;
                });
            }

            deferred.resolve();

            return promise;
        }
    });
}])
.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('AuthorizationService');
}]);