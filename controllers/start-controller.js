App.controller('StartController', ['$scope', 'RedditService', function ($scope, RedditService) {
    _.extend($scope, {

    });

    RedditService.getToken()
        .done(function (data) {
            console.log(data);

            RedditService.getMessages().done(function (data) { console.log(data); });

            RedditService.getUnreadMessages().done(function (data) { console.log(data); });
        });
}]);