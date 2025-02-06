<script lang="ts">
    import { collection, onSnapshot, getFirestore, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
     import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth"; // Importar métodos de Firebase Authentication
     import { dbUsers } from "$lib/client"; // Asegúrate de que dbUsers es la referencia correcta a tu Firestore
 
     const usersFb = collection(dbUsers, "users");
     const auth = getAuth(); // Inicializar Firebase Auth
 
     let usuarios: any[] = [];
 
     // onSnapshot(usersFb, (querySnapshot) => {
     //     let listaUsuarios: any[] = [];
     //     querySnapshot.forEach((doc) => {
     //         let usuario = { ...doc.data(), uid: doc.id };
     //         listaUsuarios.push(usuario);
     //     });
     //     usuarios = listaUsuarios;
     //     // console.log(usuarios);
     // });
 
     let email = "";
     let username = "";
     let role = "Técnico"; // Valor predeterminado para el select
     let password = ""; // Añadir un campo para la contraseña
     let error = "";
 
     const crearUsuario = async () => {
         if (email.trim() !== "" && username.trim() !== "" && role.trim() !== "" && password.trim() !== "") {
             try {
                 // Crear usuario en Firebase Authentication
                 const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                 const user = userCredential.user;
 
                 // Crear usuario en Firestore
                 await addDoc(usersFb, {
                     email: email,
                     username: username,
                     role: role,
                     isBlocked: false,
                     created_at: new Date(),
                     uid: user.uid // Usar el uid del usuario creado en Firebase Authentication
                 });
 
                 error = "";
             } catch (e: any) {
                 error = `Error al crear usuario: ${e.message}`;
             }
         } else {
             error = "Todos los campos son obligatorios";
         }
         email = "";
         username = "";
         role = "Técnico";
         password = "";
     };
 
     const bloquearDesbloquearUsuario = async (usuario: any) => {
         await updateDoc(doc(dbUsers, "users", usuario.uid), {
             isBlocked: !usuario.isBlocked,
         });
     };
 
     const eliminarUsuario = async (uid: string) => {
         try {
             // Eliminar usuario de Firestore
             await deleteDoc(doc(dbUsers, "users", uid));
 
             // Eliminar usuario de Firebase Authentication
             const user = auth.currentUser;
             if (user) {
                 await deleteUser(user);
             }
         } catch (e: any) {
             error = `Error al eliminar usuario: ${e.message}`;
         }
     };
 
     const teclaPresionada = (e: KeyboardEvent) => {
         if (e.key === "Enter") {
             crearUsuario();
         }
     };
     
   import Button from "$lib/components/ui/Button.svelte";
     
 </script>
 
 
 <div class="panel">
   <div class="col">
   <form class="crearnuevo">
   <input type="text" placeholder="Correo electrónico" bind:value={email} />
   <input type="text" placeholder="Nombre de usuario" bind:value={username} />
   <input type="password" placeholder="Contraseña" bind:value={password} /> <!-- Campo para la contraseña -->
   <select bind:value={role}>
     <option value="Admin">Super Admin</option>
       <option value="Admin">Admin</option>
       <option value="Técnico">Técnico</option>
   </select>
 <div> 
   <Button on:click={crearUsuario} >
   Agregar Usuario
 </Button></div>
  
 </form>
 </div>
 <div class="col">
 
 </div>
 </div>
 
 
 <style>
   .crearnuevo{
     display: flex;
     flex-direction: column;
     gap: 18px;
   }
  
 </style>