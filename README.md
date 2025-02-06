# create-svelte

npm install -g firebase-tools

Instalar firebase 
npm i firebase

Crear proyecto en firebase
En configuración (Engrane) configuración de proyecto
- Registrar APP y seguir instrucciones 

firebase login
firebase init
firebase deploy

### General 

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 10, 30) && request.auth != null;
    }
  }
}

## Base
service cloud.firestore {
  match /databases/{database}/documents {

    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 10, 30);
    }
  }
}

