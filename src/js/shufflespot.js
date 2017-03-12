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