var spotify = new SpotifyWebApi();

function setToken(token){
    spotify.setAccessToken(token);
}

function getPlaylists(){
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
            getSelectedPlaylistLength(data.id);
        }, function(err){
            console.error(err);
        });
}

function getSelectedPlaylistLength(userId){
    var playlistId = document.getElementById('dd-playlist').value;
    spotify.getPlaylist(userId, playlistId)
        .then(function(data) {
            randomizePlaylist(userId, playlistId, data["tracks"]["total"])
        }, function(err) {
            console.error(err);
        });
}

function randomizePlaylist(userId, playlistId, length){
    var tracks = [];
    for (var i = 0; i < length; i++) {
        tracks.push(i);
    }

    var randomTracks = window.knuthShuffle(tracks.slice(0));
    asyncLoop(0, randomTracks.length, userId, playlistId, randomTracks);
}

function asyncLoop(counter, total, userId, playlistId, randomTracks){
    if (counter < total){
        spotify.reorderTracksInPlaylist(userId, playlistId, randomTracks[counter], 0)
            .then(function(data) {
                counter++;
                console.log("moved track: " + counter);
                asyncLoop(counter, total, userId, playlistId, randomTracks)
            }, function(err) {
                console.error(err);
            });
    }
    else{
        console.log("done!");
    }
}