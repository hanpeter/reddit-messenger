App.controller('ComposeController', ['$scope', 'RedditService', function ($scope, RedditService) {
    function resetCaptcha() {
        $scope.captchaSrc = null;
        return RedditService.getCaptcha().then(function (data) {
            var promise = $.Deferred();

            $scope.sync(function () {
                $scope.captchaIden = data.iden;
                $scope.captchaSrc = data.imgSrc;

                promise.resolve();
            });

            return promise;
        });
    }

    function reset() {
        $scope.to = '';
        $scope.subject = '';
        $scope.message = '';
        $scope.captcha = '';
        $scope.hasCaptchaError = false;

        resetCaptcha().done(function () {
            $scope.sync(function () {
                $scope.isSending = false;
            });
        });
    }

    _.extend($scope, {
        to: '',
        subject: '',
        message: '',
        captchaSrc: null,
        captcha: '',
        captchaIden: null,
        isSending: false,
        hasCaptchaError: false,
        compose: function () {
            $scope.isSending = true;

            if (!to || !subject || !message || !captcha) {
                $scope.isSending = false;
                return;
            }

            var config = {
                captcha: $scope.captcha,
                iden: $scope.captchaIden,
                subject: $scope.subject,
                text: $scope.message,
                to: $scope.to
            }
            RedditService.postNewMessage(config)
                .done(function () {
                    $scope.sync(reset);
                })
                .fail(function (data) {
                    RedditService.getCaptcha(data.iden).done(function (data) {
                        $scope.sync(function () {
                            $scope.captchaIden = data.iden;
                            $scope.captchaSrc = data.imgSrc;
                            $scope.captcha = '';

                            $scope.isSending = false;
                            $scope.hasCaptchaError = true;
                        });
                    });
                });
        }
    });

    $scope.$watch('isComposing', function (value) {
        if (!value) {
            return;
        }

        reset();
    });
}]);