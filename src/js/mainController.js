var spotify = new SpotifyWebApi();

function mainController($scope){
    $scope.Playlists = [];
    $scope.SelectedPlaylist = null;

    //called by submit button
    $scope.getUserId = function(){
    spotify.getMe()
        .then(function(data){
            getTracks($scope, data.id);
        }, function(err){
            console.error(err);
        });
    }

    //boilerplate auth code, provided by the spotify documentation
    //altered only to add access_token to angular scope
    var stateKey = 'spotify_auth_state';
    var params = getHashParams();
    $scope.access_token = params.access_token
    var state = params.state
    var storedState = localStorage.getItem(stateKey);
    if ($scope.access_token && (state == null || state !== storedState)) {
        alert('There was an error during the authentication');
    }
    else {
        localStorage.removeItem(stateKey);
        if ($scope.access_token) {
            spotify.setAccessToken($scope.access_token);
            //actually do stuff
            getPlaylists($scope);
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
}

function getPlaylists($scope){
    spotify.getUserPlaylists()
        .then(function(data) {
            data.items.forEach(function(item){
                $scope.Playlists.push({
                    Title: item["name"],
                    Id: item["id"]
                });
            });
            $scope.$apply();
        }, function(err) {
            console.error(err);
        });
}

function getTracks($scope, userId){
    var tracks = [];

    var getTracksLoop = function(userId, playlistId){
        spotify.getPlaylistTracks(userId, playlistId, {limit: 100, offset: tracks.length})
        .then(function(data) {
            for (var i in data["items"]){
                tracks.push("spotify:track:" + data["items"][i]["track"]["id"]);
            }
            if (data["next"] != null){
                getTracksLoop(userId, playlistId);
            }
            else{
                removeTracks(userId, playlistId, tracks);
            }
        }, function(err) {
            console.error(err);
        });
    }

    getTracksLoop(userId, $scope.SelectedPlaylist);
}

function removeTracks(userId, playlistId, tracks){
    spotify.replaceTracksInPlaylist(userId, playlistId, [])
    .then(function(data) {
        addTracks(userId, playlistId, tracks);
    }, function(err) {
        console.error(err);
    });
}

function addTracks(userId, playlistId, tracks){
    var randomizedTracks = window.knuthShuffle(tracks.slice(0));

    var batches = [];
    for (i=0, j=randomizedTracks.length; i<j; i+=100){
        var batch = randomizedTracks.slice(i, i+100);
        batches.push(batch);
    }

    var addTracksLoop = function(userId, playlistId, counter, total){
        spotify.addTracksToPlaylist(userId, playlistId, batches[counter])
        .then(function(data) {
            counter++;
            if (counter < total){
                addTracksLoop(userId, playlistId, counter, total);
            }
            else{
                console.log("Done!")
            }
        }, function(err) {
            console.error(err);
        });
    }

    addTracksLoop(userId, playlistId, 0, batches.length);
}

//utility auth functions
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