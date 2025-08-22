//pa fout vin kopye koko manmanw chen santi

// Nouvelle configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB6VRVyODDkZNjkdcUJAOny45NgMtEyPQQ",
  authDomain: "dybytechvcf.firebaseapp.com",
  databaseURL: "https://dybytechvcf-default-rtdb.firebaseio.com",
  projectId: "dybytechvcf",
  storageBucket: "dybytechvcf.firebasestorage.app",
  messagingSenderId: "201006931483",
  appId: "1:201006931483:web:c7b6532d4bef230ecae2be",
  measurementId: "G-K7QK6ZT4FH"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const ADMIN_CREDENTIALS = [
  { username: "gaara", password: "ga-ck" },
  { username: "dyby", password: "dyby-is" }
];

const MODIFICATION_CODE = "dyby";
let currentContactId = "";
let contactToDelete = null;

function checkCredentials() {
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const spinner = document.getElementById('spinner');
  spinner.style.display = "block";
  setTimeout(() => {
    spinner.style.display = "none";
    const validUser = ADMIN_CREDENTIALS.find(user => user.username === username && user.password === password);
    if (validUser) {
      document.getElementById('login-section').style.display = "none";
      document.getElementById('admin-section').style.display = "block";
      loadContacts();
      checkMaintenanceStatus();
    } else {
      document.getElementById('error').textContent = "❌ Incorrect username or password.";
    }
  }, 1000);
}

function loadContacts() {
  db.ref('contacts').on('value', snapshot => {
    const container = document.getElementById('contactsContainer');
    container.innerHTML = "";
    snapshot.forEach(child => {
      const c = child.val();
      const key = child.key;
      const date = c.createdAt ? new Date(c.createdAt) : null;
      const formattedDate = date ? `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()} - ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}` : "Date not available";
      const customID = `NUM${String(snapshot.numChildren()).padStart(3,'0')}#${date?date.getFullYear():'YYYY'}`;
      const div = document.createElement('div');
      div.className = "contact";
      div.innerHTML = `
        <p><strong>ID:</strong> ${customID}</p>
        <p><strong>Name:</strong> ${c.fullName}</p>
        <p><strong>Phone:</strong> ${c.phone}</p>
        <p><strong>Registered:</strong> ${formattedDate}</p>
        <button onclick="editContact('${key}')">Edit</button>
        <button class="delete" onclick="deleteContact('${key}')">Delete</button>
      `;
      container.appendChild(div);
    });
  });
}

function editContact(id) {
  currentContactId = id;
  contactToDelete = null;
  document.getElementById('code-input').value = "";
  document.getElementById('code-error').style.display = "none";
  document.getElementById('codeModal').style.display = "block";
}

function checkModificationCode() {
  const enteredCode = document.getElementById('code-input').value;
  if (enteredCode === MODIFICATION_CODE) {
    closeCodeModal();
    if (contactToDelete) {
      db.ref('contacts/'+contactToDelete).remove().then(()=> {
        alert("✅ Contact deleted!");
        contactToDelete = null;
      });
    } else if (currentContactId) {
      showEditModal();
    }
  } else {
    document.getElementById('code-error').style.display = "block";
  }
}

function showEditModal() {
  db.ref('contacts/'+currentContactId).once('value').then(snapshot => {
    const contact = snapshot.val();
    document.getElementById('modal-name').value = contact.fullName;
    document.getElementById('modal-phone').value = contact.phone;
    document.getElementById('editModal').style.display = "block";
  });
}

function saveContactChanges() {
  const fullName = document.getElementById('modal-name').value;
  const phone = document.getElementById('modal-phone').value;
  if(fullName && phone){
    db.ref('contacts/'+currentContactId).update({fullName, phone}).then(()=> {
      alert("✅ Contact updated!");
      closeModal();
    });
  } else {
    alert("❌ Please provide both name and phone.");
  }
}

function closeModal() { document.getElementById('editModal').style.display = "none"; }
function closeCodeModal() { document.getElementById('codeModal').style.display = "none"; document.getElementById('code-error').style.display = "none"; }

function deleteContact(id) {
  if(confirm("Are you sure you want to delete this contact?")){
    contactToDelete = id;
    currentContactId = null;
    document.getElementById('code-input').value = "";
    document.getElementById('code-error').style.display = "none";
    document.getElementById('codeModal').style.display = "block";
  }
}

async function toggleMaintenance(){
  const snap = await db.ref('settings/maintenance').once('value');
  const current = snap.val();
  const newState = !current;
  await db.ref('settings/maintenance').set(newState);
  checkMaintenanceStatus();
  alert(`🛠️ Maintenance ${newState?'activated':'deactivated'}`);
}

function checkMaintenanceStatus(){
  db.ref('settings/maintenance').once('value').then(snap=>{
    const isActive = snap.val();
    document.getElementById('maintenanceStatus').textContent = isActive?'⚠️ Maintenance Mode is ACTIVE':'✅ Site is ONLINE';
  });
}

// Toggle password visibility
document.getElementById("togglePassword").addEventListener("click", function() {
  const passwordInput = document.getElementById("admin-password");
  const type = passwordInput.getAttribute("type")==="password"?"text":"password";
  passwordInput.setAttribute("type",type);
  this.classList.toggle("fa-eye-slash");
});

document.getElementById("toggleCodePassword").addEventListener("click", function() {
  const codeInput = document.getElementById("code-input");
  const type = codeInput.getAttribute("type")==="password"?"text":"password";
  codeInput.setAttribute("type",type);
  this.classList.toggle("fa-eye-slash");
});

window.onclick = function(event){
  const editModal = document.getElementById('editModal');
  const codeModal = document.getElementById('codeModal');
  if(event.target===editModal){ closeModal(); }
  if(event.target===codeModal){ closeCodeModal(); }
};

document.getElementById('downloadBtn').addEventListener('click', async () => {
  const snap = await db.ref('contacts').once('value');
  let vcfContent = "";
  snap.forEach(child => {
    const c = child.val();
    vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.fullName}\nTEL;TYPE=CELL:${c.phone}\nEND:VCARD\n`;
  });
  const blob = new Blob([vcfContent], { type:'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contacts.vcf';
  a.click();
  URL.revokeObjectURL(a.href);
});

//CODDING BY GAARA TECH AND DYBY TECH 😉
