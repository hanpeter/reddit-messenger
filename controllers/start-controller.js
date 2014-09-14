App.controller('StartController', ['$scope', 'RedditService', function ($scope, RedditService) {
    _.extend($scope, {

    });

    RedditService.getToken()
        .done(function (data) {
            RedditService.getMessages().done(function (data) { console.log(data); });

            setInterval(function () {
                RedditService.getUnreadMessages()
                    .done(function (data) {
                        if (data.data.children.length > 0) {
                            chrome.notifications.create('', {
                                type: "basic",
                                iconUrl: "/assets/icon_128.png",
                                title: "Unread Message",
                                message: "There is " + data.data.children.length + " unread messages."
                            }, $.noop);
                        }
                    });
            }, 5000);
        });
}]);