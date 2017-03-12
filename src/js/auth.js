(function() {
    var stateKey = 'spotify_auth_state';
    var params = getHashParams();
    var access_token = params.access_token,
        state = params.state,
        storedState = localStorage.getItem(stateKey);
    if (access_token && (state == null || state !== storedState)) {
        alert('There was an error during the authentication');
    }
    else {
        localStorage.removeItem(stateKey);
        if (access_token) {
            document.getElementById('form-area').style.display = "block";
            setToken(access_token);
            getPlaylists();
        }
        else {
            document.getElementById('login').style.display = "block";
        }
        document.getElementById('login-button').addEventListener('click', function() {
        var client_id = '8d8f54edc17e43df94cecb28b5566ee1';
        var redirect_uri = 'http://localhost:8080/src/index.html';
        var state = generateRandomString(16);
        localStorage.setItem(stateKey, state);
        var scope = 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public';
        var url = 'https://accounts.spotify.com/authorize';
        url += '?response_type=token';
        url += '&client_id=' + encodeURIComponent(client_id);
        url += '&scope=' + encodeURIComponent(scope);
        url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
        url += '&state=' + encodeURIComponent(state);
        window.location = url;
        }, false);
    }
})();

function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}