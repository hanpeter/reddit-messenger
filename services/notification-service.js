App.service('NotificationService', ['RedditConfig', function (RedditConfig) {
    var me = this,
        NOTIFICATION_BUFFER = 15000,
        NOTIFICATION_SNOOZE = 300000;

    chrome.notifications.onClicked.addListener(function (nID) {
        if (nID === me.notificationID) {
            me.notificationRefreshTime = moment().add(NOTIFICATION_SNOOZE, 'ms');
        }
    });

    _.extend(me, {
        notificationID: '',
        notificationRefreshTime: moment(),
        clear: function () {
            var promise = $.Deferred();

            if (moment().isAfter(me.notificationRefreshTime) && !!me.notificationID) {
                chrome.notifications.clear(me.notificationID, function (wasCleared) {
                    if (wasCleared) {
                        me.notificationID = '';
                        promise.resolve();
                    }
                    else {
                        promise.reject();
                    }
                });
            }
            else {
                promise.resolve();
            }

            return promise;
        },
        update: function (count) {
            var config = {
                type: "basic",
                iconUrl: "/assets/icon_128.png",
                title: "Unread message(s) for " + RedditConfig.username
            };

            return me.clear().then(function() {
                if (count > 0) {
                    _.extend(config, {
                        message: "There is " + count + " unread messages."
                    });

                    if (!me.notificationID) {
                        chrome.notifications.create('', config, function (nID) {
                            me.notificationID = nID;

                            new Audio('/assets/notification.mp3').play();

                            me.notificationRefreshTime = moment().add(NOTIFICATION_BUFFER, 'ms');
                        });
                    }
                    else {
                        chrome.notifications.update(me.notificationID, config, $.noop);
                    }
                }
            });
        }
    });
}]);