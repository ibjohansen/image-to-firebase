/**
 * Kjør på når DOM'en er klar
 */
$(document).ready(function () {

//    initier vide-funksjonalitet
    app.initVideo();

    //Legg på en listener som venter på at «Hent bilder fra Firebase» knappen skal trykkes på
    $('#get-firebase-btn').click(function (ev) {
        $('#get-firebase-btn').hide();
        app.initFirebaseListener();
    });

    //hent nytt brukernavn fra en tjeneste og sett config-objectet samt oppdatere UI
    app.setUserName();

    //legg på en listener for unload-event, for å slette brukerdata
    app.unload();

});

var config = {
    //deklarer (og åpne) en kobling til firebase
    baseref: new Firebase('https://cam-to-firebase-demo.firebaseio.com/'),

    //brukernavn for applikasjonen
    username: '',

    //tid det tar før bildet skal slettes automatisk - en time
    defaultTimeOut: 3600000
};


var app = {

    /**
     * fang video fra web-kameraet, og strøm til video-elementet HTML-siden
     */
    initVideo: function () {
        //hent det første elementet som returneres av jQuery!
        var videoElm = $('#webcam-video')[0];
        var canvas = $('#snapshot-canvas')[0];
        var img = $('#snapshot-img')[0];
        //sett opp et kontekst-objekt med metoder for å tegne på canvas
        var ctx = canvas.getContext('2d');
        var localMediaStream = null;

        //sett størrelse på video og canvas
        var videoWidth = 320;
        var videoHeight = 240;
        canvas.height = videoHeight;
        canvas.width = videoWidth;
        img.height = videoHeight;
        img.width = videoWidth;

        //bind snapshot-funksjonen til »ta bilde-knappen»
        $('#webcam-photo').click(function () {
            snapshot();
        });

        //deklarer en variabel til å holde getUserMedia med browser-spesifikke prefikser
        navigator.getUserMedia = navigator.getUserMedia
            || navigator.webkitGetUserMedia
            || navigator.mozGetUserMedia
            || navigator.msGetUserMedia
            || navigator.oGetUserMedia;

        //initier metoden, spesifiser at vi kun skal ha video,
        //og i dette tilfellet lav-kvalitetsvideo på 320*240 pixler
        //sett opp suksess- og feilhåndtering-callbacks
        if (navigator.getUserMedia) {
            navigator.getUserMedia(
                {
                    audio: false,
                    video: {
                        mandatory: {
                            minWidth: videoWidth,
                            maxWidth: videoWidth,
                            minHeight: videoHeight,
                            maxHeight: videoHeight
                        },
                        optional: [
                            {frameRate: 60},
                            {facingMode: 'user'}    //for å tvinge kamera til front kamera der hvor det finnes
                        ]
                    }
                },
                processVideoStream,
                processVideoError
            );
        } else {
            app.noSupport();

        }

        /**
         * funksjon som tegner bildet på canvas med 2d drawing api
         */
        function snapshot() {
            if (localMediaStream) {

                var metaTitle = $('#meta-title').val();
                var metaForm = $('#meta-data');
                metaForm.addClass('has-success');

                //sjekk at det er en bildetittel på bildet
                if (null != metaTitle && undefined != metaTitle && '' != metaTitle) {
                    //tegn bildet på canvas
                    ctx.drawImage(videoElm, 0, 0, videoWidth, videoHeight);

                    //konverter bildet fra canvas til base64-enkodet tekst-streng
                    //populer img-elementets src-atributt med denne
                    var b64representation = canvas.toDataURL('image/png');
                    img.src = b64representation;

                    //lagre bildet til Firebase
                    //Opprett et JSON-objekt som holder brukernavn, tittel , tidspunkt og bilde
                    var objToFirebase = {
                        user: config.username,
                        time: new Date().getTime(),
                        title: metaTitle,
                        img: b64representation
                    };

                    //push objektet til Firebase
                    var imgRef = config.baseref.child(objToFirebase.user).push();
                    imgRef.setWithPriority(objToFirebase, objToFirebase.time, function () {
                        //vis knappen som kobler opp Firebase i on-complete callback fra Firebase
                        $('#get-firebase-btn').show();
                    });
                } else {
                    //Sett på feil-klasse på meta-data feltet for å be bruker om en bildetittel
                    metaForm.addClass('has-error');
                }

            }
        }

        /**
         * suksess-funksjonen som prosesserer videostrømmen
         * @param stream
         */
        function processVideoStream(stream) {
            //fjern transparent overlay
            $('.content-overlay').remove();
            //vis videostrøm
            videoElm.src = window.URL.createObjectURL(stream);
            localMediaStream = stream;
        }

        /**
         * feilhåndterings funksjon som håndterer eventuelle feil
         * @param e
         */
        function processVideoError(e) {
            // noe smart feilhåndtering
        }
    },
    /**
     * funksjon som initierer en listner mot firebase, og viser bildene på siden
     */
    initFirebaseListener: function () {

        //skru på en ajax-loader for i gi bruker beskjed om at noe skjer
        $('#spinner').show();

        //husk at all lesing fra og skriving til Firebase skjer asynkront, så alt du skal gjøre med
        //data og eventuelle returer fra oppdateringskall må skje i callbacks

        //finner DOM-objektet som skal holde på bildene
        var imageList = $('#img-list');

        //opprett en live kobling mot "child_added" eventet, dette fanger opp når det blir lagt til en ny node
        //og kjøres også første gang du gjør et kall
        //metoden returnerer et snapshot, som man kan kalle val() på og
        // dette returnerer data fra firebase som et JSON-objekt
        config.baseref.child(config.username).on('child_added', function (snapshot, prevChild) {

            //hent et snapshot av bildedata fra Firebase
            var fbImg = snapshot.val();

            //vi oppretter et DOM-objekt basert på img-container template
            var imgTag = $('#templates').find('.img-container').clone();

            //og setter de forskjellige attributtene
            imgTag.attr('id', snapshot.name());
            imgTag.find('.img-image').attr('src', fbImg.img);
            var meta = fbImg.title + ' (' + app.formatDate(fbImg.time) + ')';
            imgTag.find('.img-meta-data').text(meta);

            //skjul spinner
            $('#spinner').hide();

            //legger til objektet FØRST i listen, slik at nye bilder ikke havner øverst
            imageList.prepend(imgTag);

            //slett bildet etter en time
            setTimeout(function () {
                config.baseref.child(config.username).child(snapshot.name()).remove();
            }, config.defaultTimeOut);

            //fjern «Koble opp Firebase»-knappen
            $('#get-firebase-btn').remove();

        });

        //opprett en listener på "child_removed"-eventet
        //bytt ut bilde og metadata på DOM-noden som korresponderer med det slettede bildet
        //med noe som forteller bruker at bildet er slettet.
        config.baseref.child(config.username).on('child_removed', function (oldChildSnapshot) {
            //fjern transparent overlay
            $('.content-overlay').remove();
            var imgTag = $('#' + oldChildSnapshot.name());
            imgTag.find('.img-image').attr('src', '/app/img/logo_inbeta.png');
            imgTag.find('.img-meta-data').text('Bildet er automatisk slettet fra databasen');
        });
    },
    /**
     * Hent brukernavn fra en tjeneste som tibyr det
     */
    setUserName: function () {
        $.get("http://apigram.herokuapp.com/artifex/new", function (data) {
            config.username = data.data;
            $('#user-name').append(' ' + data.data)
        });
    },

    /**
     * VELDIG enkel datoformattering, bruk et std bibliotek for dette!
     * @param timestamp tidspunkt i millisekunder
     * @returns {string} "formatert" dato-streng
     */
    formatDate: function (timestamp) {

        function pad(input) {
            if (parseInt(input) < 10) {
                return '0' + input
            } else {
                return input
            }
        }

        var dsep = '.';
        var tsep = ':';
        var d = new Date(parseInt(timestamp));
        var year = d.getFullYear();
        var month = pad(d.getMonth() + 1);
        var day = pad(d.getDate());
        var hour = pad(d.getHours());
        var min = pad(d.getMinutes());

        return day + dsep + month + dsep + year + ' ' + hour + tsep + min

    },

    /**
     * Slett brukerdata når bruker forlater applikasjonen eller tar en refresh
     */
    unload: function () {
        $(window).bind('beforeunload', function () {
            config.baseref.child(config.username).remove();
        });
    },
    /**
     *   Enkel feilhåndtering dersom nettleseren ikke støtter getUserMedia
     */
    noSupport: function () {
        var row = $('<div class="row">');
        var col = $('<div class="col-lg-12 col-md-12">');
        var inbetaLogo = $('<img src="/app/img/logo_inbeta.png">');
        var txtDiv = $('<div>');
        txtDiv.html('<h1>Beklager, funksjonen getUserMedia() støttes ikke av din nettleser og dermed faller grunnalget for denne applikasjonen bort</h1>');
        txtDiv.append('<h2><a href="http://caniuse.com/stream">Sjekk om browseren din støtter nødvendig funksjonalitet her</a></h2>');
        col
            .append(inbetaLogo)
            .append(txtDiv);
        row
            .append(col);

        $('.container')
            .html('')
            .append(row)
    }
};

