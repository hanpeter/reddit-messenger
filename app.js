window.App = angular
    .module('App', [])
    .constant('RedditConfig', {
        clientID: '_OiiEDnIKbwbOg',
        scope: 'privatemessages,identity,submit',
        redirectUri: 'https://' + chrome.runtime.id + '.chromiumapp.org/provider_cb'
    })
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.headers.common['Content-type'] = 'application/x-www-form-urlencoded';
    }]);
