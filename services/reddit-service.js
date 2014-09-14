App.service('RedditService', [function () {
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

    _.extend(me, {
        getToken: function () {
            var state = randomStateGenerator(20),
                params = {
                    client_id: '_OiiEDnIKbwbOg',
                    response_type: 'code',
                    state: state,
                    redirect_uri: encodeURIComponent('https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb'),
                    duration: 'permanent',
                    scope: 'privatemessages'
                },
                options = {
                    interactive: true,
                    url: generateURL('https://ssl.reddit.com/api/v1/authorize', params)
                }
                promise = $.Deferred();

            chrome.identity.launchWebAuthFlow(options, function (redirectUri) {
                if (!redirectUri) {
                    promise.reject('Invalid redirectUri', redirectUri);
                }

                var parser = $('<a></a>').attr('href', redirectUri)[0],
                    query = parseQueryString(parser.search.substr(1));
                
                if (chrome.runtime.lastError) {
                    promise.reject(chrome.runtime.lastError);
                }

                if (query.state !== state) {
                    promise.reject('Invalid state');
                }

                me.token = query.code;

                promise.resolve(me.token);
            });

            return promise;
        }
    });
}]);