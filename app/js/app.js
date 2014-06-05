/**
 * Kjør på når DOM'en er klar
 */
$(document).ready(function () {

    app.initVideo();
});


var app = {

    /**
     * capture the video stream from the web cam and stream it to the video element on the web page
     * fang video fra web-kameraet, og strøm til video-elementet
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
                ctx.drawImage(videoElm, 0, 0);
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
    }
};

