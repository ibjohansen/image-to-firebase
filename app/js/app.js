/**
 * Kjør på når DOM'en er klar
 */
$(document).ready(function () {

    app.initVideo();
    $('#get-firebase-btn').click(function () {
        app.initFirebaseListener();
    })
});

var config = {
    //deklarer (og åpne) en kobling til firebase
    baseref: new Firebase('https://cam-to-firebase-demo.firebaseio.com/')
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
        var videoHeight = 240;
        var videoWidth = 320;
        canvas.height = videoHeight;
        canvas.width = videoWidth;

        //bind snapshot-funksjonen til ta bilde-knappen med jQuery
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
                    video: {
                        mandatory: {
                            maxWidth: 320,
                            maxHeight: 240
                        }
                    },
                    audio: false
                },
                processVideoStream,
                processVideoError
            );
        } else {
            //enkel feilhåndtering dersom nettleseren ikke støtter getUserMedia
            alert('Beklager, funksjonen getUserMedia() støttes ikke av din nettleser');
            var inbetaLogo = $('<img src="/app/img/logo_inbeta.png">');
            videoElm.html(inbetaLogo);
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
                    ctx.drawImage(videoElm, 0, 0);

                    //populer img-elementets src-atributt med base64 enkodet versjon av bildet
                    var b64representation = canvas.toDataURL('image/png');
                    img.src = b64representation;

                    //lagre bildet til Firebase
                    //Opprett et JSON-objekt som holder tittel og bilde
                    var objToFirebase = {
                        title: metaTitle,
                        img: b64representation
                    };
                    //push objektet til Firebase
                    var imgRef = config.baseref.push(objToFirebase)

                } else {
                    //Sett på feil-klasse på meta-data feltet
                    metaForm.addClass('has-error');
                }

            }
        }

        /**
         * suksess-funksjonen som prosesserer videostrømmen
         * @param stream
         */
        function processVideoStream(stream) {
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

        //Vi lager en tom array som skal holde bildene våre,
        //ettersom Firebase returnerer objekter og det er litt greiere å
        //gjøre vanlige liste operasjoner på en array
        var images = [];
        var imageList = $('#img-list');


        //lage en live kobling mot "child_added" eventet, dette fanger opp når det blir lagt til en ny node
        //og kjøres også første gang du gjør et kall
        //metoden returnerer et snapshot, som man kan kalle val() på og
        // dette returnerer data fra firebase som et JSON-objekt
        config.baseref.on('child_added', function (snapshot, prevChild) {

            var fbImg = snapshot.val();
            images.push(fbImg);
            var imgTag = $('#templates').find('.img-container').clone();

            imgTag.find('.img-image').attr('src', fbImg.img);
            imgTag.find('.img-meta-data').text(fbImg.title);
            $('#spinner').hide();
            imageList.append(imgTag);

        });
    }
};

