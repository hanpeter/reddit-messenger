chrome.app.runtime.onLaunched.addListener(function() {
    var dimensions = chrome.storage.sync.get(['winWidth', 'winHeight'], function (data) {
        chrome.app.window.create('index.html', {
            innerBounds: {
                width: data.winWidth || 800,
                height: data.winHeight || 600
            },
            frame: {
                type: 'chrome'
            }
        });
    });
});