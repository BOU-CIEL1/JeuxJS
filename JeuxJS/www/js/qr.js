var ipServeur = '172.17.50.125';     // Adresse ip du serveur  
var ws;                             // Variable pour l'instance de la WebSocket.

window.onload = function () {
    if (TesterLaCompatibilite()) {
        ConnexionAuServeurWebsocket();
    }
    ControleIHM();
}

//Tester la compatibilité entre WebSocket et le serveur Web
function TesterLaCompatibilite() {
    let estCompatible = true;
    if (!('WebSocket' in window)) {
        window.alert('WebSocket non supporté par le navigateur');
        estCompatible = false;
    }
    return estCompatible;

    /*  ***************** Connexion au serveur WebSocket ********************   */
    // 
    function ConnexionAuServeurWebsocket() {
        ws = new WebSocket('ws://' + ipServeur + '/qr');

        ws.onclose = function (evt) {
            window.alert('WebSocket close');
        };

        ws.onopen = function () {
            console.log('WebSocket open');
        };

        ws.onmessage = function (evt) {
            document.getElementById('messageRecu').value = evt.data;
        };
    }

    function ControleIHM() {
        document.getElementById('Envoyer').onclick = BPEnvoyer;
    }

    function BPEnvoyer() {
        ws.send(document.getElementById('messageEnvoi').value);
    }

    /*  ****************** Broadcast clients WebSocket  **************   */
    var aWss = expressWs.getWss('/echo');
    var WebSocket = require('ws');
    aWss.broadcast = function broadcast(data) {
        console.log("Broadcast aux clients navigateur : %s", data);
        aWss.clients.forEach(function each(client) {
            if (client.readyState == WebSocket.OPEN) {
                client.send(data, function ack(error) {
                    console.log("    -  %s-%s", client._socket.remoteAddress,
                        client._socket.remotePort);
                    if (error) {
                        console.log('ERREUR websocket broadcast : %s', error.toString());
                    }
                });
            }
        });
    };

    var question = '?';
    var bonneReponse = 0;

    // Connexion des clients a la WebSocket /qr et evenements associés 
    // Questions/reponses 
    exp.ws('/qr', function (ws, req) {
        console.log('Connection WebSocket %s sur le port %s',
            req.connection.remoteAddress, req.connection.remotePort);
        NouvelleQuestion();

        ws.on('message', TraiterReponse);

        ws.on('close', function (reasonCode, description) {
            console.log('Deconnexion WebSocket %s sur le port %s',
                req.connection.remoteAddress, req.connection.remotePort);
        });


        function TraiterReponse(message) {
            console.log('De %s %s, message :%s', req.connection.remoteAddress,
                req.connection.remotePort, message);
            if (message == bonneReponse) {
                NouvelleQuestion();
            }
        }


        function NouvelleQuestion() {
            var x = GetRandomInt(11);
            var y = GetRandomInt(11);
            question = x + '*' + y + ' =  ?';
            bonneReponse = x * y;
            aWss.broadcast(question);
        }

        function GetRandomInt(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }

    });

