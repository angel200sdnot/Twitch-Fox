(function () {

    var root = this;

    var constants = {
        twitchApi: {
            api: "https://api.twitch.tv/kraken/oauth2/authorize",
            response_type: 'token',
            client_id: 'dzawctbciav48ou6hyv0sxbgflvfdpp',
            client_secret: 'b1smws17iv8ob4wpbi4671mf6ceus3r',
            scope: 'user_follows_edit user_read',
            redirect_uri: 'https://hunter5000.github.io/twitchfox.html'
        }
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = constants;
        }
        exports.constants = constants;
    } else {
        root.constants = constants;
    }
}).call(this);