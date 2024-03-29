

function initApp() {

    // init schema
    _schema = {
        data: "d",

        model: {
            id: "PersonId",  // <----- This is used to get the detail
            fields: {
                PersonId: "PersonId",
                FirstName: "FirstName",
                LastName: "LastName",
                Email: "Email",
                Title: "Title",
                ManagerId: "ManagerId",
                Telephone: "Telephone",
                Initial: "Initial"
            },
        },
        parse: function (response) {

            var data = response.d;

            if (data != null) {

                for (var i = 0; i < data.length; i++) {
                    data[i].Initial = data[i].FirstName.charAt(0); // We want to GroupBy the first letter of the firstname
                }

                response.d = data;
            }
            return response;
        }
    };

    // init fav datasource
    _dsFavourites = new kendo.data.DataSource({
        schema: _schema,
        group: { field: "Initial" }

    });

    // attempt to get the favs
    var favData = localStorage.getItem(_storageKeyFavs);
    if (favData != null)
    {
        _dsFavourites._data = JSON.parse(favData);
        updateBadge(_dsFavourites._data.length);
    }

}

// helpers

/// <summary>
/// Updates the Fav button to show Delete
/// </summary>
function showRemoveFromFavIcon() {
    $("#savebutton").find(".km-icon").removeClass("km-favorites").addClass("km-delete");
}

/// <summary>
/// Updates the Fav button to show Add
/// </summary>
function showAddToFavIcon() {
    $("#savebutton").find(".km-icon").removeClass("km-delete").addClass("km-favorites");
}


/// <summary>
/// Finds a contact in the favourites data source against a given Id
/// </summary>
/// <param name="personId">Person Id to seach for</param>
/// <returns>Person object or null if no match</returns>
function findFavouritePerson(personId) {

    var personMatch = null;
    for (var i = 0; i < _dsFavourites._data.length; i++) {

        if (_dsFavourites._data[i].PersonId == personId) {
            personMatch = _dsFavourites._data[i];
            break;
        }

    }
    return personMatch;
}

/// <summary>
/// Based on a given personId switch the favourites button Icon
/// So if they are a fav then show the remove/delete icon
/// </summary>
/// <param name="personId">Person Id to seach for</param>
function switchFavouritesButtonIcon(personId) {

    var personMatch = findFavouritePerson(personId);

    if (personMatch != null) {
        showRemoveFromFavIcon();
    } else {
        showAddToFavIcon();
    }
}

// GEO handlers
function onGEOSuccess(position) {

    var lat = _currentPerson.Latitude;
    var lng = _currentPerson.Longitude;
    var toLocation = new google.maps.LatLng(lat, lng);
    var fromLocation = position;

    showDirection(fromLocation, toLocation);

}

function onGEOError(position) {

    alert('Failed');
}

// navigate and display the map
function showLocationMap(e) {

    _app.navigate('#locationMap', 'slide:right');
    // get the view
    var mapView = $("#locationMap");

    // we have the currently selected person via _currentPerson

    var lat = _currentPerson.Latitude;
    var lng = _currentPerson.Longitude;
    var latLng = new google.maps.LatLng(lat, lng);
    var mapOptions = {
        center: latLng,
        panControl: false,
        zoomControl: true,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var mapObj = document.getElementById("map_holder");
    var map = new google.maps.Map(mapObj, mapOptions);

    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: _currentPerson.OfficeName + "\n" + _currentPerson.AddressLine1 + "\n" + _currentPerson.AddressLine2 + "\n" + _currentPerson.AddressLine3
    });

    // navigator.geolocation.getCurrentPosition(onGEOSuccess, onGEOError);
}

function showDirection(orgn, dstntn) {
    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer();

    var map = new google.maps.Map(document.getElementById('map_holder'), {
        zoom: 7,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('displayDirections'));

    var request = {
        origin: orgn,
        destination: dstntn,
        travelMode: google.maps.DirectionsTravelMode.WALKING
    };

    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        }
    });
    var win = function (position) {
        var lat = position.coords.latitude;
        var long = position.coords.longitude;
        var myLatlng = new google.maps.LatLng(lat, long);
        var iconimage = "img/logo.png";
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            icon: iconimage
        });

        marker.setMap(map);

        //Add these lines to include all 3 points in the current viewport
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(orgn);
        bounds.extend(dstntn);
        bounds.extend(myLatlng);
        map.fitBounds(bounds);
    };

    var fail = function (e) {
        alert('Can\'t retrieve position.\nError: ' + e);
    };


}


/// <summary>
/// Adds a person to the Favs
/// </summary>
function addToFavs(e) {

    // ok we have the person Id, save to local storage
    var person = _currentPerson;
    var exists = false;

    // check to see if the user exists or not in their favs collection
    if (findFavouritePerson(person.PersonId) != null) {
        exists = true;
    } else {
        exists = false;
    }

    // only add to favs if the contact doesn't exist
    if (!exists) {

        // add
        _dsFavourites.add(person);

        // update the local storage
        localStorage.setItem(_storageKeyFavs, JSON.stringify(_dsFavourites._data));

        // show the correct icon
        showRemoveFromFavIcon();

        updateBadge(_dsFavourites.data().length);

        // tell the user!
        alert(person.FirstName
            + ' ' + person.LastName
            + ' has been added to your favourites!');

    } else {

        // remove the fav (taken from http://jsfiddle.net/derickbailey/D4g8S/)
        var raw = _dsFavourites.data();
        var length = raw.length;
        var item, i;

        for (i = length - 1; i >= 0; i--) {
            item = raw[i];
            if (item.PersonId == person.PersonId) {
                _dsFavourites.remove(item);
                break; // .. as we're done
            }

        }

        // update the local storage with the change
        localStorage.setItem(_storageKeyFavs, JSON.stringify(_dsFavourites._data));

        // show the correct icon
        showAddToFavIcon();

        updateBadge(_dsFavourites.data().length);

        // tell the user!
        alert(person.FirstName
            + ' ' + person.LastName
            + ' has been removed from your favourites!');
    }
}

/// <summary>
/// Get's the profile information based on email
/// </summary>
function getProfile() {

    if (searchEmail.value != null) {
        var searchProfile = "http://localhost:1679/CloudProxy.ashx?email=" + searchEmail.value;

        _dsMyProfile = new kendo.data.DataSource({
            transport: {
                read: {
                    url: searchProfile,
                    dataType: "json",
                    beforeSend: function (req) {
                        //Specifying this header ensures that the results will be returned as JSON.
                        req.setRequestHeader("MaxDataServiceVersion", "2.0"); // <==== This is important.   I think you can probably do this at the server side to enforce 2.0   
                        req.setRequestHeader("Accept", "application/json");

                    }
                }
            },

            schema: _schema,

            error: function (e) {
                // hide the loading screen on error
                _app.hideLoading();
                alert(e); // fow now let's just show the error
                console.log("Error " + e);
            },
            change: function () {
                alert('Hello');
            }

        });

        _dsMyProfile.read();

    }
}

/// <summary>
/// Show the Details view based on the person selected (view.params.id) 
/// </summary>
function showDetailsView(e) {
    var view = e.view;

    // let's see where this details call is coming in from
    var calleeType = view.params.calleeType;


    if (calleeType == "search") {

        var item = null;

        _ds.fetch(function () {
            item = _ds.get(view.params.id);
            view.scrollerContent.html(_itemDetailsTemplate(item));

            _currentPerson = item;

            switchFavouritesButtonIcon(view.params.id);

            kendo.mobile.init(view.content);

        });

    } else {

        // we can assume it's favs.  The data here is local
        _dsFavourites.fetch(function () {

            // we have to go through the local data here to find a match
            var personMatch = null;

            var foundMatch = false;
            for (var i = 0; i < _dsFavourites._data.length; i++) {
                personMatch = _dsFavourites._data[i];
                if (personMatch.PersonId == view.params.id) {
                    foundMatch = true;
                    break;
                }

            }

            if (foundMatch) {

                // ok we have found a match, let's apply the template
                view.scrollerContent.html(_itemDetailsTemplate(personMatch));

                _currentPerson = personMatch;

                // show the delete icon
                showRemoveFromFavIcon();



                // kick off the view
                kendo.mobile.init(view.content);


            }


        });
    }




}

/// <summary>
/// Refresh the listview
/// </summary>
function showContacts(e) {
    e.view.content.find(".item-list").data("kendoMobileListView").refresh();
}

/// <summary>
/// Displays the favourites
/// </summary>
function showFavorites(e) {

    $("#featuredList").kendoMobileListView({ dataSource: _dsFavourites, template: $("#personTemplateFavs").html() });
    // if we don't have any data then we need to force a refresh (so we get an empty list)
    if (_dsFavourites._data.length >= 0) {
        var listView = $('#featuredList').data('kendoMobileListView');
        listView.refresh();
    }

}


/// <summary>
/// Get's the data based on the user's search criteria
/// </summary>
function getData(callback) {

    // shwo the loading screen
    _app.showLoading();

    var template = kendo.template($("#personTemplate").html());

    var searchTerm = '';

    if (searchBox.value != null) 
    {
        
        clearContactsList();

        //searchTerm = "http://localhost:1679/CloudProxy.ashx?search=" + searchBox.value;
        searchTerm = "http://peopledirectory.cloudapp.net/PeopleDirectoryWCFDataService.svc/GetPeople?$top=50&namePart='" + searchBox.value + "'";

        _ds = new kendo.data.DataSource({
            transport: {
                read: {
                    url: searchTerm,
                    dataType: "json",
                    beforeSend: function (req) {
                        //Specifying this header ensures that the results will be returned as JSON.
                        req.setRequestHeader("MaxDataServiceVersion", "2.0"); // <==== This is important.   I think you can probably do this at the server side to enforce 2.0   
                        req.setRequestHeader("Accept", "application/json");

                    }
                }
            },
            schema: _schema,
            group: { field: "Initial" },
            error: function (e) {
                // hide the loading screen on error
                _app.hideLoading();
                console.log("Error " + e);
            },
            change: function () {
                $("#contactsList").html(kendo.render(template, this.view()));
            }
        });

        _ds.read();

        $("#contactsList").kendoMobileListView({ dataSource: _ds, template: $("#personTemplate").html() });
    }

}

function clearContactsList()
{
    $("#contactsList").hide();
    $("#contactsList").empty();
    $("#contactsList").show();
}

/// <summary>
/// Bind the results and use the template to show each row
/// </summary>
function onResult(resultData) {

    console.log("Results " + resultData);

    $("#contactsList").kendoMobileListView({

        dataSource: kendo.data.DataSource.create({ data: resultData }),
        template: $("#personTemplate").html()

    });

    // hide the loading after we get the results
    _app.hideLoading();
}

function updateBadge(count)
{
    $("#fav .km-text").find(".km-badge").remove().end().append("<span class='km-badge'>" + count + "</span>")
}

