var ipServeur = '172.17.50.125';     // Adresse ip du serveur  
var ws;                             // Variable pour l'instance de la WebSocket.

class CQr {
    constructor() {
        this.question = "?";
        this.bonneReponse = null;
    }

    // tire un entier aléatoire entre min et max inclus
    GetRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // génère une nouvelle question de type : "binaire de 8 bits"
    NouvelleQuestion() {
        // tirer un entier 0..255
        let n = this.GetRandomInt(0, 255);
        // transformer en binaire 8 bits
        let binaire = n.toString(2).padStart(8, '0');
        // enregistrer
        this.question = "Donne la valeur décimale du nombre binaire : " + binaire;
        this.bonneReponse = n;
        return this.question;
    }

    // traite une réponse envoyée par un client via WebSocket
    TraiterReponse(wsClient, message) {
        let reponse = parseInt(message);
        if (reponse === this.bonneReponse) {
            wsClient.send("Bonne réponse ! ✅");
            // nouvelle question après bonne réponse
            let nouvelle = this.NouvelleQuestion();
            wsClient.send(nouvelle);
        } else {
            wsClient.send("Mauvaise réponse ❌ Essaye encore !");
        }
    }
}

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

        // Cette fonction affiche un message de validation ("Juste !" ou "Faux !") seulement à la personne qui a répondu, 
        // dans la zone de question, puis efface ce message au bout de 3 secondes et affiche une nouvelle question.

        function afficherValidation(estJuste) {
            const questionZone = document.getElementById('question');
            const ancienTexte = questionZone.innerHTML;
            // Affiche le message de résultat
            questionZone.innerHTML = estJuste ? "Juste !" : "Faux !";

            // Après 3 secondes, efface le message et affiche une nouvelle question
            setTimeout(function () {
                questionZone.innerHTML = "Nouvelle question : ...";
                // (Remplacer par le code pour générer la nouvelle question si besoin)
            }, 3000);
        }

        // Exemple d'utilisation : appeler afficherValidation(true) ou afficherValidation(false) après une réponse.


    });

    /* ********** serveur WebSocket express /qr ********** */

    exp.ws('/qr', function (ws, req) {
        console.log('Connexion WebSocket %s:%s',
            req.connection.remoteAddress, req.connection.remotePort);

        // Envoie une première question
        let q = jeuxQr.NouvelleQuestion();
        ws.send(q);

        // Callback intermédiaire
        function TMessage(message) {
            jeuxQr.TraiterReponse(ws, message);
        }

        ws.on('message', TMessage);

        ws.on('close', function (reasonCode, description) {
            console.log('Déconnexion %s:%s',
                req.connection.remoteAddress, req.connection.remotePort);
        });
    });

    ws.on('message', jeuxQr.TraiterReponse.bind(jeuxQr, ws));
    var jeuxQr = new CQr();

