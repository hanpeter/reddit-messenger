App.controller('ListController', ['$scope', '$sce', 'RedditService', function ($scope, $sce, RedditService) {
    _.extend($scope, {
        messages: []
    });

    RedditService.getToken()
        .done(function (data) {
            RedditService.getMessages().done(function (data) {
                var messages = [];

                console.log(data.children);
                _.each(_.pluck(data.children, 'data'), function (value) {
                    messages.push({
                        id: value.id,
                        author: value.author,
                        body: $sce.trustAsHtml('<p>' + value.body.replace(/\n\n/g, '</p><p>') + '</p>'),
                        firstMessageID: value.first_message,
                        isUnread: value.new
                    });
                });

                $scope.sync(function () {
                    $scope.messages = messages;
                });
            });

            setInterval(function () {
                RedditService.getUnreadMessages()
                    .done(function (data) {
                        if (data.children.length > 0) {
                            chrome.notifications.create('', {
                                type: "basic",
                                iconUrl: "/assets/icon_128.png",
                                title: "Unread Message",
                                message: "There is " + data.children.length + " unread messages."
                            }, $.noop);
                        }
                    });
            }, 5000);
        });
}]);