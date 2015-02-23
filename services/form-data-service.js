App.service('FormDataService', [function ($q, RedditConfig) {
    var me = this;

   _.extend(me, {
        request: function (config) {
            if (config.method === 'POST') {
                config.data = $.param(config.data);
            }

            return config;
        }
    });
}])
.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('FormDataService');
}]);