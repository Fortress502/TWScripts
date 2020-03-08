javascript:

if (window.location.href.indexOf('map') < 0) {
    window.location.assign(game_data.link_base_pure + "map");
}
else {
    var currentVillX = game_data.village.x;
    var currentVillY = game_data.village.y;
    var barbarianVillages = [];
    var radius;
    var inRangeBarb = [];
    var backgroundColor = "#36393f";
    var borderColor = "#3e4147";
    var headerColor = "#202225";
    var titleColor = "#ffffdf";

    $.getAll = function (
        urls, // array of URLs
        onLoad, // called when any URL is loaded, params (index, data)
        onDone, // called when all URLs successfully loaded, no params
        onError // called when a URL load fails or if onLoad throws an exception, params (error)
    ) {
        var numDone = 0;
        var lastRequestTime = 0;
        var minWaitTime = 200; // ms between requests
        loadNext();
        function loadNext() {
            if (numDone == urls.length) {
                onDone();
                return;
            }

            let now = Date.now();
            let timeElapsed = now - lastRequestTime;
            if (timeElapsed < minWaitTime) {
                let timeRemaining = minWaitTime - timeElapsed;
                setTimeout(loadNext, timeRemaining);
                return;
            }
            console.log('Getting ', urls[numDone]);
            $("#progress").css("width", `${(numDone + 1) / urls.length * 100}%`);
            lastRequestTime = now;
            $.get(urls[numDone])
                .done((data) => {
                    try {
                        onLoad(numDone, data);
                        ++numDone;
                        loadNext();
                    } catch (e) {
                        onError(e);
                    }
                })
                .fail((xhr) => {
                    onError(xhr);
                })
        }
    };


    csv = ["map/village.txt"];
    list = "";

    //check if we got recent version of village list
    if ("villagesList" in localStorage) {
        list = JSON.parse(localStorage.getItem('villagesList'));
        console.log(list);
        timeSinceLastPull = compareDates(Date.parse(list[1]));
        if (timeSinceLastPull > 1) {
            //repull villagetxt, over an hour ago
            console.log("More than an hour since last pull of village.txt from server, repulling...");
            $.getAll(csv,
                (i, blabla) => {
                    console.log(blabla);
                    list = blabla;
                },
                () => {
                    finish();
                },
                (error) => {
                    console.error(error);
                });
            time = new Date();
            villagesList = [ list ,  time ];
            localStorage.setItem("villagesList", JSON.stringify(villagesList));
            console.log(JSON.parse(localStorage.getItem('villagesList')));
        }
        else {
            //keep old villagetxt
            console.log("Less than an hour since last pull of village.txt from server");
            list = list[0];
            finish(list);
        }
    }
    else {
        console.log("Grabbing list for first time");
        $.getAll(csv,
            (i, blabla) => {
                console.log(blabla);
                list = blabla;
            },
            () => {
                time = new Date();
                villagesList = [ list ,  time ];
                console.log(villagesList);
                localStorage.setItem("villagesList", JSON.stringify(villagesList));
                finish(list);
            },
            (error) => {
                console.error(error);
            });

    };

    function check_a_village(a, b, x, y, r) {
        var dist_points = (a - x) * (a - x) + (b - y) * (b - y);
        r *= r;
        if (dist_points <= r) {
            return true;
        }
        return false;
    }

    function finish(list) {
        villages = CSVToArray(list);

        for (i = 0; i < villages.length; i++) {
            if (villages[i][4] == "0") {
                barbarianVillages.push(villages[i][2] + villages[i][3]);
            }
        }
        console.log("making display");

        if ($("#barbScript")[0]) $("#barbScript")[0].remove();


        var fakeHtml = `<div id="barbScript" class="ui-widget-content" style="background-color:${backgroundColor}">
        <table id="tableBarbShaper" class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}">
        <tr style="background-color:${backgroundColor}">
            <tr style="background-color:${backgroundColor}">
                <td id="fakeScriptTitle" style="text-align:center; width:auto; background-color:${headerColor}">
                <h2>
                    <center style="margin:10px"><u>
                            <font color="${titleColor}">Barb finder</font>
                        </u>    
                    </center>
                </h2>
            </td>
            </tr>
            <tr style="background-color:${backgroundColor}">
            <td style="text-align:center; width:auto; background-color:${backgroundColor}"><textarea id="script"  rows=7 style="width:500px;resize: none;background-color:${backgroundColor};color:${titleColor}" placeholder="Script output"></textarea></td>
            </tr>
            <tr style="background-color:${backgroundColor}">
            <td style="text-align:center; width:auto; background-color:${backgroundColor}"><textarea id="range" maxlength=3 style="width:100px;resize: none;overflow:hidden;background-color:${backgroundColor};color:${titleColor}" placeholder="Enter radius"></textarea></td>
            </tr>
            
        <tr style="background-color:${backgroundColor}">
        <td style="text-align:center; width:auto; background-color:${backgroundColor}"><input type="button"  class="btn evt-confirm-btn btn-confirm-yes" id="findCoords" onclick="findBarbs()" value="Find barbs" ">
        </td></tr>
          </tr>
          <tr id="coords" style="background-color:${backgroundColor};width=100px">
          </tr>
        </table>
        <hr>
        </div>`;

        $("#minimap_whole").before(fakeHtml);
        $("#script").hide();
    }


    function findBarbs() {
        inRangeBarb = [];
        scriptText = "";
        $("#coords")[0].innerHTML = "";
        radius = $("#range")[0].value;
        for (var i = 0; i < barbarianVillages.length; i++) {
            if (barbarianVillages[i] != undefined) {
                target = barbarianVillages[i];
                target = target.toString();
                targetX = target.substring(0, 3);
                targetY = target.substring(3, 6);
                if (check_a_village(currentVillX, currentVillY, targetX, targetY, radius) == true) {
                    inRangeBarb.push({ targetX, targetY });
                };
            }
        }
        var scriptText = "";
        for (var j = 0; j < inRangeBarb.length; j++) {
            scriptText += inRangeBarb[j].targetX + "|" + inRangeBarb[j].targetY + " ";
        }

        $("#coords")[0].innerHTML = `<font color="${titleColor}"><p>Total found: ${inRangeBarb.length}</p><p>${scriptText}</p></font>`;
        $("#script")[0].innerHTML = `javascript:sp=0;sw=0;ax=0;scout=1;lc=0;hv=0;cat=0;ra=0;coords='${scriptText}';var doc=document;if(window.frames.length>0)doc=window.main.document;url=doc.URL;if(url.indexOf('screen=place')==-1)alert('This script needs to be run from the rally point');coords=coords.split(' ');index=Math.round(Math.random()*(coords.length-1));coords=coords[index];coords=coords.split('|');doc.forms[0].x.value=coords[0];doc.forms[0].y.value=coords[1];insertUnit(doc.forms[0].spear,sp);insertUnit(doc.forms[0].sword,sw);insertUnit(doc.forms[0].axe,ax);insertUnit(doc.forms[0].spy,scout);insertUnit(doc.forms[0].light,lc);insertUnit(doc.forms[0].heavy,hv);insertUnit(doc.forms[0].ram,ra);insertUnit(doc.forms[0].catapult,cat);void(0)`
        $("#script").show();
        var distance = [];
        var coordinateHome = currentVillX + "|" + currentVillY;
        for (k = 0; k < inRangeBarb.length; k++) {
            target = inRangeBarb[k].targetX + "|" + inRangeBarb[k].targetY;
            distance.push(calculateDistance(target, coordinateHome) + " " + target)
        }
        console.table(distance);
    }
    function calculateDistance(to, from) {
        var target = extractCoords(to).match(/(\d+)\|(\d+)/);
        var source = extractCoords(from).match(/(\d+)\|(\d+)/);
        var fields = Math.sqrt(Math.pow(source[1] - target[1], 2) + Math.pow(source[2] - target[2], 2));

        return fields;
    }
    function extractCoords(src) {
        var loc = src.match(/\d+\|\d+/ig);
        return (loc ? loc[loc.length - 1] : null);
    }

    function CSVToArray(strData, strDelimiter) {
        strDelimiter = (strDelimiter || ",");
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );
        var arrData = [[]];
        var arrMatches = null;
        while (arrMatches = objPattern.exec(strData)) {
            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[1];
            if (
                //check if its string
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ) {
                //create new row
                arrData.push([]);
            }
            var strMatchedValue;

            if (arrMatches[2]) {

                //get rid of quotes
                strMatchedValue = arrMatches[2].replace(
                    new RegExp("\"\"", "g"),
                    "\""
                );

            } else {

                // no quotes
                strMatchedValue = arrMatches[3];
            }
            //add to array
            arrData[arrData.length - 1].push(strMatchedValue);
        }
        // Return the parsed data.
        return (arrData);
    }

    function compareDates(x) {
        var start = x,
            end = new Date(),
            diff = new Date(end - start),
            hours = diff / 1000 / 60 / 60;
        console.log("checked " + hours + " ago for village list");
        return hours;
    }
}