$(function () {

    if (typeof jQuery == "undefined") {
        alert("Bootstrap Hashgrid: jQuery not loaded. Make sure it's linked to your pages.");
    }
    var metaGrid = new metaBoostrapGrid();

});


var metaBoostrapGrid = function () {
    
    var options = {
        placeholder: 'body',
        id: 'divGrid',          // id for the grid container
        modifierKey: null,      // optional 'ctrl', 'alt' or 'shift'
        showGridKey: 'g',       // key to show the grid
        holdGridKey: 'h'       // key to hold the grid in place                             
    },
    overlay,    
    sticky = false,
    overlayOn = false;    

    // Remove any conflicting overlay
    if ($('#' + options.id).length > 0) {
        $('#' + options.id).remove();
    }

    // Create overlay grid
    overlayEl = $('<div></div>');
    overlayEl.attr('id', options.id);
    $(options.placeholder).prepend(overlayEl);
    overlay = $('#' + options.id);

    // Create grid rows
    overlay.html('<div class="container"><div class="row"></div></div>');
    for (i = 0; i < 12; i++) overlay.find(".row").prepend('<div class="col-xs-1 col-sm-1 col-md-1 col-lg-1"></div>');

    // Bind keyboard controls
    $(document).bind('keydown', keydownHandler);
    $(document).bind('keyup', keyupHandler);

    // Check for saved state
    overlayCookie = readCookie("metagrid" + options.id);
    if (typeof overlayCookie == 'string') {
        state = overlayCookie.split('-');                  
        if (state[0] == '1') {
            overlayOn = true;
            sticky = true;
            $("body").addClass("grid");
        }
    }

    function keydownHandler(e) {        
        var m = getModifier(e); if (!m) return true;
        var k = getKey(e); if (!k) return true;
        switch (k) {
            case options.showGridKey:
                if (!overlayOn) {
                    $("body").addClass("grid");
                    overlayOn = true;
                }
                else if (sticky) {                    
                    $("body").removeClass("grid");                    
                    overlayOn = false;
                    sticky = false;
                    saveState();
                }
                break;
            case options.holdGridKey:
                if (overlayOn && !sticky) {                    
                    sticky = true;
                    saveState();
                }
                break;            
        }
        return true;
    }

    function keyupHandler(e) {
        var k = getKey(e);
        var m = getModifier(e);
        if (k && (k == options.showGridKey) && !sticky) {            
            $("body").removeClass("grid");            
            overlayOn = false;
        }
        return true;
    }


    function getKey(e) {
        var k = false, c = (e.keyCode ? e.keyCode : e.which);
        if (c == 13) k = 'enter';
        else k = String.fromCharCode(c).toLowerCase();
        return k;
    }

    function getModifier(e) {
        if (options.modifierKey === null) return true; var m = true;
        switch (options.modifierKey) {
            case 'ctrl': m = (e.ctrlKey ? e.ctrlKey : false); break;
            case 'alt': m = (e.altKey ? e.altKey : false); break;
            case 'shift': m = (e.shiftKey ? e.shiftKey : false); break;
        }
        return m;
    }

    function saveState() {
        createCookie("metagrid" + options.id, (sticky ? '1' : '0'), 1);
    }

    function createCookie(name, value, days) {
        var date, expires = "";
        if (days) {
            date = new Date(); date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function readCookie(name) {
        var c,ca = document.cookie.split(';'),i = 0,len = ca.length, nameEQ = name + "=";
        for (; i < len; i++) {
            c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);            
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);            
        }
        return null;
    }
}