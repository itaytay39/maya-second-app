// 🔍 בדיקה מעמיקה שנייה - נתונים ופונקציונליות
console.log("🚀 מתחיל אתחול אפליקציית מאיה...");

// נתונים בסיסיים - כל המשתמשים מוצגים ישר
let participants = [
    {name: 'נועה בר', city: 'תל אביב', lat: 32.0853, lon: 34.7818, phone: '0501111111', whatsapp: '0501111111'},
    {name: 'דוד לוי', city: 'חיפה', lat: 32.7940, lon: 34.9896, phone: '0522222222', whatsapp: '0522222222'},
    {name: 'רוני ישראלי', city: 'ירושלים', lat: 31.7683, lon: 35.2137, phone: '0533333333', whatsapp: '0533333333'},
    {name: 'אור בן דוד', city: 'באר שבע', lat: 31.2518, lon: 34.7913, phone: '0544444444', whatsapp: '0544444444'},
    {name: 'תמר שלו', city: 'אילת', lat: 29.5581, lon: 34.9482, phone: '0505555555', whatsapp: '0505555555'},
    {name: 'יונתן כהן', city: 'נתניה', lat: 32.3215, lon: 34.8532, phone: '0506666666', whatsapp: '0506666666'}
];

let admin = false;
const adminPassword = "1234";
let editIdx = null;

// הגנת אדמין - פונקציות רגישות
const AdminGuard = {
    isAdmin: () => admin,
    requireAdmin: (callback) => {
        if (!admin) {
            console.warn("🚫 ניסיון גישה לא מורשה לפונקציית אדמין");
            alert("נדרשת הרשאת מנהל לפעולה זו");
            return false;
        }
        return callback();
    }
};

// אתחול מפה
const map = L.map('map').setView([31.5, 34.75], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// אייקון סמן מודרני ומתקדם
const modernMarkerIcon = L.divIcon({
    className: 'modern-marker',
    html: `
        <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        ">
            <div style="
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
            "></div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// אלמנטים
const adminModal = document.getElementById('admin-login-modal');
const userModal = document.getElementById('user-form-modal');
const addBtn = document.getElementById('add-user-btn');
const searchInput = document.getElementById('search-input');
const participantCount = document.getElementById('participant-count');

// פונקציות עזר
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function geocodeCity(city) {
    try {
        console.log(`🔍 מחפש מיקום עבור: ${city}`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', ישראל')}`;
        const resp = await fetch(url, {headers: {'Accept-Language': 'he'}});
        const data = await resp.json();
        if (data && data.length > 0) {
            console.log(`✅ נמצא מיקום עבור ${city}`);
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        throw new Error('לא נמצא מיקום לעיר שהוזנה');
    } catch (error) {
        console.error(`❌ שגיאה בחיפוש מיקום עבור ${city}:`, error);
        throw new Error('שגיאה בחיפוש מיקום העיר');
    }
}

// עדכון מספר משתתפים
function updateParticipantCount() {
    participantCount.textContent = `${participants.length} משתתפים`;
    console.log(`📊 עודכן מספר משתתפים: ${participants.length}`);
}

// הוספת סמנים למפה - כל המשתמשים מוצגים ישר
function renderMarkers(list = participants) {
    console.log("🗺️ מציג סמנים על המפה...");
    
    // ניקוי סמנים קיימים
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
    });
    
    list.forEach((p, idx) => {
        const whatsappNum = (p.whatsapp && p.whatsapp.length > 0) ? p.whatsapp : p.phone;
        const hasWhatsapp = whatsappNum && whatsappNum.length >= 9;
        
        // בדיקת קרבה למשתתפים אחרים
        let nearby = null;
        for (let j = 0; j < participants.length; j++) {
            const other = participants[j];
            if (other === p) continue;
            if (
                typeof other.lat === "number" &&
                typeof other.lon === "number" &&
                distance(p.lat, p.lon, other.lat, other.lon) <= 20
            ) {
                nearby = other;
                break;
            }
        }

        // בועית מתקדמת עם כל הפיצ'רים
        const popup = `
            <div class="popup-box">
                <div class="popup-name">
                    <span class="material-symbols-outlined" style="color: #6366f1;">person</span>
                    ${p.name}
                </div>
                <div class="popup-city">
                    <span class="material-symbols-outlined" style="color: #6366f1;">location_on</span>
                    <span>${p.city}</span>
                </div>
                <div class="popup-phone">📞 ${p.phone.replace(/^0(\d{2,3})(\d{7})$/, '0$1-$2')}</div>
                <div class="popup-btns">
                    <a href="tel:${p.phone}" class="popup-btn phone" target="_blank">
                        <span class="material-symbols-outlined">call</span>
                        צור קשר
                    </a>
                    ${hasWhatsapp ? `
                    <a href="https://wa.me/972${whatsappNum.replace(/^0/,'')}" class="popup-btn whatsapp" target="_blank">
                        <span class="material-symbols-outlined">chat</span>
                        וואטסאפ
                    </a>
                    ` : ''}
                    ${admin ? `
                    <button class="popup-btn edit" onclick="editUser(${idx})">
                        <span class="material-symbols-outlined">edit</span>
                        ערוך
                    </button>
                    <button class="popup-btn delete" onclick="deleteUser(${idx})">
                        <span class="material-symbols-outlined">delete</span>
                        מחק
                    </button>
                    ` : ''}
                    ${nearby && hasWhatsapp ? `
                    <button class="popup-btn carpool" onclick="suggestCarpool('${p.name}', '${whatsappNum}')">
                        <span class="material-symbols-outlined">directions_car</span>
                        הצע נסיעה משותפת
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        const marker = L.marker([p.lat, p.lon], {icon: modernMarkerIcon}).addTo(map);
        marker.bindPopup(popup, {closeButton: true, maxWidth: 350});
    });
    
    console.log(`✅ הוצגו ${list.length} סמנים על המפה`);
}

// פונקציות גלובליות לשימוש בפופאפ - מוגנות באדמין
window.editUser = function(idx) {
    return AdminGuard.requireAdmin(() => {
        console.log(`✏️ עריכת משתמש: ${participants[idx].name}`);
        editIdx = idx;
        const p = participants[idx];
        document.getElementById('user-form-title').innerText = '✏️ עריכת משתתף';
        document.getElementById('user-name').value = p.name;
        document.getElementById('user-city').value = p.city;
        document.getElementById('user-phone').value = p.phone;
        document.getElementById('user-whatsapp').value = p.whatsapp || '';
        userModal.hidden = false;
    });
};

window.deleteUser = function(idx) {
    return AdminGuard.requireAdmin(() => {
        const user = participants[idx];
        if (confirm(`האם אתה בטוח שברצונך למחוק את ${user.name}?`)) {
            console.log(`🗑️ מוחק משתמש: ${user.name}`);
            participants.splice(idx, 1);
            renderMarkers();
            updateParticipantCount();
        }
    });
};

window.suggestCarpool = function(name, phone) {
    console.log(`🚗 הצעת נסיעה משותפת ל: ${name}`);
    const message = encodeURIComponent(`היי ${name}, רוצה לתאם נסיעה משותפת למשלחת מאיה לאוגנדה? 🚗✈️`);
    window.open(`https://wa.me/972${phone.replace(/^0/,'')}?text=${message}`, '_blank');
};

// מאזיני אירועים
document.getElementById('admin-login-btn').addEventListener('click', () => {
    console.log("🔐 נפתח מודל כניסת אדמין");
    adminModal.hidden = false;
    document.getElementById('admin-password').focus();
});

document.getElementById('admin-cancel').addEventListener('click', () => {
    adminModal.hidden = true;
    document.getElementById('admin-password').value = '';
});

document.getElementById('admin-login').addEventListener('click', () => {
    const password = document.getElementById('admin-password').value;
    console.log("🔑 ניסיון התחברות אדמין");
    
    if (password === adminPassword) {
        admin = true;
        addBtn.style.display = 'block';
        adminModal.hidden = true;
        document.getElementById('admin-password').value = '';
        console.log("✅ התחברות אדמין הצליחה");
        renderMarkers(); // רענן סמנים להצגת כפתורי עריכה
        
        // שינוי כפתור אדמין להתנתקות
        const adminBtn = document.getElementById('admin-login-btn');
        adminBtn.innerHTML = '<span class="material-symbols-outlined">logout</span>';
        adminBtn.title = 'התנתק';
        adminBtn.onclick = () => {
            console.log("🚪 התנתקות אדמין");
            admin = false;
            addBtn.style.display = 'none';
            adminBtn.innerHTML = '<span class="material-symbols-outlined">admin_panel_settings</span>';
            adminBtn.title = 'כניסת אדמין';
            adminBtn.onclick = () => adminModal.hidden = false;
            renderMarkers();
        };
    } else {
        console.warn("❌ ניסיון התחברות אדמין נכשל");
        alert('סיסמה שגויה!');
        document.getElementById('admin-password').value = '';
    }
});

// הוספת משתמש - מוגן באדמין
addBtn.addEventListener('click', () => {
    return AdminGuard.requireAdmin(() => {
        console.log("➕ פתיחת טופס הוספת משתמש");
        editIdx = null;
        document.getElementById('user-form-title').innerText = '➕ הוסף משתתף';
        document.getElementById('user-name').value = '';
        document.getElementById('user-city').value = '';
        document.getElementById('user-phone').value = '';
        document.getElementById('user-whatsapp').value = '';
        userModal.hidden = false;
    });
});

document.getElementById('user-cancel').addEventListener('click', () => {
    userModal.hidden = true;
});

// שמירת משתמש - מוגן באדמין
document.getElementById('user-save').addEventListener('click', async () => {
    return AdminGuard.requireAdmin(async () => {
        const name = document.getElementById('user-name').value.trim();
        const city = document.getElementById('user-city').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const whatsapp = document.getElementById('user-whatsapp').value.trim();
        
        if (!name || !city || !phone) {
            alert('אנא מלא את כל השדות הנדרשים');
            return;
        }
        
        if (!/^0\d{8,9}$/.test(phone)) {
            alert('מספר טלפון לא תקין');
            return;
        }
        
        try {
            const saveBtn = document.getElementById('user-save');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="material-symbols-outlined">autorenew</span> שומר...';
            
            console.log(`💾 שומר משתמש: ${name} מ${city}`);
            const { lat, lon } = await geocodeCity(city);
            
            if (editIdx !== null) {
                console.log(`✏️ עודכן משתמש: ${participants[editIdx].name} → ${name}`);
                participants[editIdx] = {name, city, lat, lon, phone, whatsapp};
                editIdx = null;
            } else {
                console.log(`➕ נוסף משתמש חדש: ${name}`);
                participants.push({name, city, lat, lon, phone, whatsapp});
            }
            
            userModal.hidden = true;
            renderMarkers();
            updateParticipantCount();
            
        } catch (err) {
            console.error("❌ שגיאה בשמירת משתמש:", err);
            alert('לא נמצא מיקום לעיר שהוזנה. אנא בדוק את שם העיר.');
        } finally {
            const saveBtn = document.getElementById('user-save');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="material-symbols-outlined">save</span> שמירה';
        }
    });
});

// חיפוש
searchInput.addEventListener('input', function() {
    const val = this.value.trim().toLowerCase();
    console.log(`🔍 חיפוש: "${val}"`);
    
    if (!val) {
        renderMarkers();
        return;
    }
    const filtered = participants.filter(p =>
        p.name.toLowerCase().includes(val) || 
        p.city.toLowerCase().includes(val) || 
        p.phone.includes(val)
    );
    console.log(`📋 נמצאו ${filtered.length} תוצאות חיפוש`);
    renderMarkers(filtered);
});

// סגירת מודלים בלחיצה חיצונית
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.hidden = true;
    }
});

// אתחול ראשוני
window.addEventListener('resize', () => { map.invalidateSize(); });
setTimeout(() => { map.invalidateSize(); }, 500);

// הצגת כל המשתמשים ישר מההתחלה
console.log("🚀 מתחיל עיבוד נתונים ראשוני...");
renderMarkers();
updateParticipantCount();
console.log("✅ אפליקציית מאיה מוכנה לשימוש!");

// 📊 סטטיסטיקות למפתחים
console.log(`
📊 סטטיסטיקות המערכת:
👥 משתתפים: ${participants.length}
🔐 מצב אדמין: ${admin ? 'מחובר' : 'מנותק'}
🗺️ מרכז מפה: [31.5, 34.75]
🎨 עיצוב: Material Design 3
📱 רספונסיבי: כן
🔍 חיפוש: זמין
🚗 נסיעות משותפות: זמין
`);
