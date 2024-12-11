var spotify = new SpotifyWebApi();

function mainController($scope){
    $scope.Playlists = [];
    $scope.SelectedPlaylist = null;
    $scope.copyResult = false;
    $scope.SelectedDestination = null;
    $scope.statusMssg = "";

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
        var redirect_uri = window.location.href + 'index.html';
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
                if (item) {
                    $scope.Playlists.push({
                        Title: item["name"],
                        Id: item["id"]
                    });
                }
            });
            $scope.$apply();
        }, function(err) {
            console.error(err);
        });
}

function getTracks($scope){
    updateStatus($scope, "Fetching tracklist...")
    var tracks = [];

    var getTracksLoop = function(playlistId){
        spotify.getPlaylistTracks(playlistId, {limit: 100, offset: tracks.length})
        .then(function(data) {
            for (var i in data["items"]){
                tracks.push("spotify:track:" + data["items"][i]["track"]["id"]);
            }
            if (data["next"] != null){
                getTracksLoop(playlistId);
            }
            else{
                targetPlaylist = $scope.copyResult ? $scope.SelectedDestination : $scope.SelectedPlaylist
                removeTracks($scope, targetPlaylist, tracks);
            }
        }, function(err) {
            console.error(err);
        });
    }

    getTracksLoop($scope.SelectedPlaylist);
}

function removeTracks($scope, playlistId, tracks){
    updateStatus($scope, "Preparing to shuffle...");
    spotify.replaceTracksInPlaylist(playlistId, [])
    .then(function(data) {
        addTracks($scope, playlistId, tracks);
    }, function(err) {
        console.error(err);
    });
}

function addTracks($scope, playlistId, tracks){
    var culledTracks = tracks.filter(t => t != "spotify:track:null");
    var randomizedTracks = window.knuthShuffle(culledTracks.slice(0));

    var batches = [];
    for (i=0, j=randomizedTracks.length; i<j; i+=100){
        var batch = randomizedTracks.slice(i, i+100);
        batches.push(batch);
    }

    var addTracksLoop = function(playlistId, counter, total){
        updateStatus($scope, "Shuffling tracks in batches: " + (counter+1) + " out of " + batches.length + "...");
        spotify.addTracksToPlaylist(playlistId, batches[counter])
        .then(function(data) {
            counter++;
            if (counter < total){
                addTracksLoop(playlistId, counter, total);
            }
            else{
                updateStatus($scope, "Done!");
            }
        }, function(err) {
            console.error(err);
        });
    }

    addTracksLoop(playlistId, 0, batches.length);
}

//utility functions
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

function updateStatus($scope, mssg){
    $scope.statusMssg = mssg;
    $scope.$apply();
}