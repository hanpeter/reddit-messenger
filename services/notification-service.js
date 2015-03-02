App.service('NotificationService', ['$timeout', '$q', 'RedditConfig', 'StorageService', function ($timeout, $q, RedditConfig, StorageService) {
    var me = this;

    chrome.notifications.onClicked.addListener(function (nID) {
        StorageService.loadConfigs()
            .then(function (config) {
                if (nID === me.notificationID) {
                    me.notificationRefreshTime = moment().add(config.option.notification.snooze, 's');
                }
            });
    });

    _.extend(me, {
        notificationID: '',
        notificationRefreshTime: moment(),
        clear: function () {
            var deferred = $q.defer();

            if (moment().diff(me.notificationRefreshTime, 'seconds') >= 0 && !!me.notificationID) {
                chrome.notifications.clear(me.notificationID, function (wasCleared) {
                    if (wasCleared) {
                        me.notificationID = '';
                        deferred.resolve();
                    }
                    else {
                        deferred.reject();
                    }
                });
            }
            else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        update: function (count) {
            var config = {
                type: "basic",
                iconUrl: "/assets/icon_128.png",
                title: "Unread message(s) for " + RedditConfig.username
            };

            me.clear()
                .then(StorageService.loadConfigs)
                .then(function (c) {
                    $timeout(function () {
                        if (count > 0) {
                            _.extend(config, {
                                message: "There is " + count + " unread messages."
                            });

                            if (!me.notificationID) {
                                chrome.notifications.create('', config, function (nID) {
                                    me.notificationID = nID;

                                    new Audio('/assets/notification.mp3').play();

                                    me.notificationRefreshTime = moment().add(c.option.notification.interval, 's');
                                });
                            }
                            else {
                                chrome.notifications.update(me.notificationID, config, $.noop);
                            }
                        }
                    });
                });
        }
    });
}]);