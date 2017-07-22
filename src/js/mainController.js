var spotify = new SpotifyWebApi();

function mainController($scope){
    //boilerplate auth code, provided by the spotify documentation
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
            //actually do stuff
            setToken(access_token);
            getPlaylists($scope);
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
}

function setToken(token){
    spotify.setAccessToken(token);
}

function getPlaylists($scope){
    spotify.getUserPlaylists()
        .then(function(data) {
            populateDropdown(data.items);
        }, function(err) {
            console.error(err);
        });
}

function populateDropdown(playlists){
    var dropdown = document.getElementById('dd-playlist');
    for(var p in playlists){
        var playlist = playlists[p];
        var option = document.createElement('option');
        option.value = playlist["id"];
        option.innerHTML = playlist["name"];
        dropdown.appendChild(option);
    }
}

function getUserId(){
    spotify.getMe()
        .then(function(data){
            getTracks(data.id);
        }, function(err){
            console.error(err);
        });
}

function getTracks(userId){
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

    var playlistId = document.getElementById('dd-playlist').value;
    getTracksLoop(userId, playlistId);
}

function removeTracks(userId, playlistId, tracks){
    var batches = [];
    for (i=0, j=tracks.length; i<j; i+=100){
        var batch = tracks.slice(i, i+100);
        batches.push(batch);
    }

    var removeTracksLoop = function(userId, playlistId, counter, total){
        spotify.removeTracksFromPlaylist(userId, playlistId, batches[counter])
        .then(function(data) {
            counter++;
            if (counter < total){
                removeTracksLoop(userId, playlistId, counter, total);
            }
            else{
                addTracks(userId, playlistId, tracks);
            }
        }, function(err) {
            console.error(err);
        });
    }

    removeTracksLoop(userId, playlistId, 0, batches.length);
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