firebase deploy --only functions


firebase deploy --only functions

firebase emulators:start --only functions,firestore
firebase emulators:start --only functions,firestore

firebase emulators:start --only functions,firestore --import=./data/record.json


Dentro de functions

npx eslint .
npx eslint . --fix

Forzar ejecución de envios 
https://console.cloud.google.com/cloudscheduler


        const copiaEmail = "danireysan@gmail.com";
        const copiaOcultaEmail = "edgar.carmona@powerimpulse.com.mx";

         cc: [copiaEmail],
        bcc: [copiaOcultaEmail],