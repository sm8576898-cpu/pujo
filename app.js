let isAdmin = false;
let currentYear = new Date().getFullYear().toString(); 
let currentCategory = ''; 
let availableYears = []; 

// =========================================
// ১. ইনিশিয়ালাইজেশন এবং লগইন চেক
// =========================================
window.onload = () => {
    setTimeout(() => {
        loadYearsFromDatabase();
        
        if (window.onAuthStateChanged) {
            window.onAuthStateChanged(window.auth, (user) => {
                if (user) {
                    isAdmin = true;
                    document.getElementById('admin-login-btn').classList.add('hidden');
                    document.getElementById('admin-logout-btn').classList.remove('hidden');
                    let adminElements = document.querySelectorAll('.admin-only');
                    adminElements.forEach(el => el.classList.remove('hidden'));
                } else {
                    isAdmin = false;
                    document.getElementById('admin-login-btn').classList.remove('hidden');
                    document.getElementById('admin-logout-btn').classList.add('hidden');
                    let adminElements = document.querySelectorAll('.admin-only');
                    adminElements.forEach(el => el.classList.add('hidden'));
                }
                loadAllData();
                setupViewCounter();
            });
        }
    }, 1000);
};

// =========================================
// ২. বছর বা সাল কন্ট্রোল
// =========================================
function loadYearsFromDatabase() {
    const yearsRef = window.dbRef(window.database, 'system/years');
    window.dbOnValue(yearsRef, (snapshot) => {
        if (snapshot.exists()) {
            availableYears = snapshot.val();
        } else {
            availableYears = [currentYear];
            window.dbSet(yearsRef, availableYears);
        }
        renderYearSelector();
    });
}

function renderYearSelector() {
    const yearSelect = document.getElementById('year-select');
    yearSelect.innerHTML = '';
    availableYears.sort((a, b) => b - a).forEach(year => {
        let opt = document.createElement('option');
        opt.value = year;
        opt.innerText = year;
        if (year === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    });
}

function openAddYearPrompt() {
    const newYear = prompt("নতুন পুজো বছর লিখুন (যেমন: 2027):");
    if (newYear && newYear.trim().length === 4 && !isNaN(newYear)) {
        if (!availableYears.includes(newYear)) {
            availableYears.push(newYear);
            window.dbSet(window.dbRef(window.database, 'system/years'), availableYears).then(() => {
                currentYear = newYear; 
                renderYearSelector();
                loadAllData(); 
                alert(newYear + " সাল সফলভাবে যোগ করা হয়েছে!");
            });
        } else {
            alert("এই সালটি আগে থেকেই ড্রপডাউনে আছে!");
            currentYear = newYear;
            renderYearSelector();
            loadAllData();
        }
    } else if (newYear !== null) {
        alert("দয়া করে সঠিক ৪ সংখ্যার সাল লিখুন!");
    }
}

function handleYearChange() {
    currentYear = document.getElementById('year-select').value;
    loadAllData(); 
}

// =========================================
// ৩. অ্যাডমিন লগইন / লগআউট কন্ট্রোল
// =========================================
function toggleAdminModal() { document.getElementById('auth-modal').classList.toggle('hidden'); }

function submitAdminLogin() {
    const email = document.getElementById('admin-email').value.trim(); 
    const password = document.getElementById('admin-password').value;
    
    if (!email || !password) { alert("দয়া করে ইমেইল এবং পিন দিন!"); return; }
    window.signInWithEmailAndPassword(window.auth, email, password)
        .then(() => {
            alert("লগইন সফল হয়েছে!");
            toggleAdminModal();
            document.getElementById('admin-email').value = '';
            document.getElementById('admin-password').value = '';
        })
        .catch((error) => { alert("ভুল ইমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।"); });
}

function logoutAdmin() {
    if(confirm("আপনি কি লগআউট করতে চান?")) {
        window.signOut(window.auth).then(() => alert("লগআউট সফল হয়েছে!"));
    }
}

// =========================================
// ৪. ডেটা লোড করা 
// =========================================
function loadAllData() {
    loadNotices();
    loadFinancialData();
    loadExpenses();
    if (currentCategory) loadCategoryData(); 
}

function loadNotices() {
    const noticesRef = window.dbRef(window.database, 'notices');
    window.dbOnValue(noticesRef, (snapshot) => {
        const noticeList = document.getElementById('notice-list');
        noticeList.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const notice = data[key];
                const safeText = notice.text.replace(/"/g, '&quot;');
                const actionHtml = isAdmin ? `
                    <div style="margin-top:5px;">
                        <button class="edit-entry-btn" data-text="${safeText}" onclick="editNotice('${key}', this.getAttribute('data-text'))">এডিট</button>
                        <button class="delete-entry-btn" onclick="deleteData('notices/${key}')">ডিলিট</button>
                    </div>` : '';
                
                noticeList.innerHTML += `
                    <div class="notice-item">
                        <span class="notice-date">${notice.date}</span>
                        ${notice.text}
                        ${actionHtml}
                    </div>
                `;
            });
        } else {
            noticeList.innerHTML = '<p style="color:#a0a0b5; font-size:13px;">কোনো নোটিশ নেই।</p>';
        }
    });
}

function loadFinancialData() {
    const yearRef = window.dbRef(window.database, `funds/${currentYear}`);
    window.dbOnValue(yearRef, (snapshot) => {
        let totalIncome = 0; let totalExpense = 0;
        if (snapshot.exists()) {
            const data = snapshot.val();
            ['mukto_haste', 'guest_card', 'matha_pichu', 'adhai'].forEach(cat => {
                if (data[cat]) Object.values(data[cat]).forEach(item => totalIncome += Number(item.amount || 0));
            });
            if (data.expenses) Object.values(data.expenses).forEach(item => totalExpense += Number(item.amount || 0));
        }
        document.getElementById('total-income').innerText = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('total-expense').innerText = `₹${totalExpense.toFixed(2)}`;
        document.getElementById('net-balance').innerText = `₹${(totalIncome - totalExpense).toFixed(2)}`;
    });
}

function loadExpenses() {
    const expensesRef = window.dbRef(window.database, `funds/${currentYear}/expenses`);
    window.dbOnValue(expensesRef, (snapshot) => {
        const tbody = document.getElementById('expense-table-body');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                const safePurpose = item.purpose.replace(/"/g, '&quot;');
                const actionHtml = isAdmin ? `
                    <td class="admin-only no-print" style="white-space: nowrap;">
                        <button class="edit-entry-btn" data-purpose="${safePurpose}" data-amount="${item.amount}" onclick="editExpense('${key}', this.getAttribute('data-purpose'), this.getAttribute('data-amount'))">এডিট</button>
                        <button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/expenses/${key}')">ডিলিট</button>
                    </td>` : '<td class="admin-only hidden no-print"></td>';
                
                tbody.innerHTML += `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.purpose}</td>
                        <td style="color:#ff4757; font-weight:bold;">₹${item.amount}</td>
                        ${actionHtml}
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো খরচের হিসাব নেই</td></tr>`;
        }
    });
}

// =========================================
// ৫. মডাল ও ক্যাটাগরি ডেটা (উইথ হোয়াটসঅ্যাপ শেয়ার)
// =========================================
function openCategoryModal(categoryId, title) {
    currentCategory = categoryId;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('data-modal').classList.remove('hidden');
    // মডাল খোলার সময় সার্চ বক্স ফাঁকা করা
    document.getElementById('search-modal').value = '';
    loadCategoryData();
}

function closeCategoryModal() {
    document.getElementById('data-modal').classList.add('hidden');
    currentCategory = '';
}

function loadCategoryData() {
    if(!currentCategory) return;
    const catRef = window.dbRef(window.database, `funds/${currentYear}/${currentCategory}`);
    window.dbOnValue(catRef, (snapshot) => {
        const tbody = document.getElementById('modal-table-body');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                const safeName = item.name.replace(/"/g, '&quot;');
                
                const editDelHtml = isAdmin ? `
                    <button class="edit-entry-btn" data-name="${safeName}" data-amount="${item.amount}" onclick="editCategory('${key}', this.getAttribute('data-name'), this.getAttribute('data-amount'))">এডিট</button>
                    <button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/${currentCategory}/${key}')">ডিলিট</button>
                ` : '';
                
                // শেয়ার বাটন সবার জন্য, এডিট/ডিলিট অ্যাডমিনের জন্য
                const actionHtml = `
                    <td class="no-print" style="white-space: nowrap;">
                        <button onclick="shareWhatsApp('${safeName}', '${item.amount}')" style="background:#25D366;color:white;border:none;padding:5px 8px;border-radius:4px;cursor:pointer;font-size:11px;margin-right:5px;">💬 শেয়ার</button>
                        ${editDelHtml}
                    </td>`;
                
                tbody.innerHTML += `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.name}</td>
                        <td style="color:#2ed573; font-weight:bold;">₹${item.amount}</td>
                        ${actionHtml}
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো এন্ট্রি নেই</td></tr>`;
        }
    });
}

// =========================================
// ৬. ডেটা সেভ করা (Add)
// =========================================
function addNewNotice() {
    const text = document.getElementById('new-notice-text').value;
    if (!text) { alert("নোটিশ ফাঁকা রাখা যাবে না!"); return; }
    const dateStr = new Date().toLocaleDateString('bn-IN');
    window.dbPush(window.dbRef(window.database, 'notices'), { text: text, date: dateStr })
        .then(() => document.getElementById('new-notice-text').value = '');
}

function addExpenseEntry() {
    const purpose = document.getElementById('exp-purpose').value;
    const amount = document.getElementById('exp-amount').value;
    let date = document.getElementById('exp-date').value || new Date().toISOString().split('T')[0];
    if (!purpose || !amount) { alert("বিবরণ এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    window.dbPush(window.dbRef(window.database, `funds/${currentYear}/expenses`), { purpose: purpose, amount: Number(amount), date: date })
        .then(() => { document.getElementById('exp-purpose').value = ''; document.getElementById('exp-amount').value = ''; });
}

function addCategoryDataEntry() {
    const name = document.getElementById('data-name').value;
    const amount = document.getElementById('data-amount').value;
    let date = document.getElementById('data-date').value || new Date().toISOString().split('T')[0];
    if (!name || !amount) { alert("নাম এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    window.dbPush(window.dbRef(window.database, `funds/${currentYear}/${currentCategory}`), { name: name, amount: Number(amount), date: date })
        .then(() => { document.getElementById('data-name').value = ''; document.getElementById('data-amount').value = ''; });
}

// =========================================
// ৭. ডেটা এডিট করা (Edit)
// =========================================
function editNotice(key, currentText) {
    const newText = prompt("নোটিশ আপডেট করুন:", currentText);
    if (newText !== null && newText.trim() !== "" && newText !== currentText) {
        window.dbUpdate(window.dbRef(window.database, `notices/${key}`), { text: newText });
    }
}

function editExpense(key, currentPurpose, currentAmount) {
    const newPurpose = prompt("খরচের বিবরণ আপডেট করুন:", currentPurpose);
    if (newPurpose === null) return; 
    const newAmountStr = prompt("টাকার পরিমাণ আপডেট করুন (₹):", currentAmount);
    if (newAmountStr === null) return;
    if (newPurpose.trim() !== "" && newAmountStr.trim() !== "") {
        window.dbUpdate(window.dbRef(window.database, `funds/${currentYear}/expenses/${key}`), { purpose: newPurpose, amount: Number(newAmountStr) });
    }
}

function editCategory(key, currentName, currentAmount) {
    const newName = prompt("নাম / বিবরণ আপডেট করুন:", currentName);
    if (newName === null) return;
    const newAmountStr = prompt("টাকার পরিমাণ আপডেট করুন (₹):", currentAmount);
    if (newAmountStr === null) return;
    if (newName.trim() !== "" && newAmountStr.trim() !== "") {
        window.dbUpdate(window.dbRef(window.database, `funds/${currentYear}/${currentCategory}/${key}`), { name: newName, amount: Number(newAmountStr) });
    }
}

// =========================================
// ৮. ডেটা ডিলিট করা
// =========================================
function deleteData(path) {
    if(confirm("আপনি কি নিশ্চিত যে এই এন্ট্রিটি ডিলিট করতে চান?")) {
        window.dbRemove(window.dbRef(window.database, path));
    }
}

// =========================================
// ৯. ভিউ কাউন্টার লজিক
// =========================================
function setupViewCounter() {
    const viewsRef = window.dbRef(window.database, 'system/viewCount');
    window.dbOnValue(viewsRef, (snapshot) => {
        let count = snapshot.exists() ? snapshot.val() : 0;
        const counterElement = document.getElementById('app-view-count');
        if (counterElement) {
            counterElement.innerText = count.toLocaleString('bn-IN');
        }
    });

    if (!sessionStorage.getItem('hasCountedView')) {
        window.dbOnValue(viewsRef, (snapshot) => {
            let currentCount = snapshot.exists() ? snapshot.val() : 0;
            window.dbSet(viewsRef, currentCount + 1);
            sessionStorage.setItem('hasCountedView', 'true');
        }, { onlyOnce: true });
    }
}

// =========================================
// ১০. লাইভ সার্চ (Live Search)
// =========================================
function searchTable(inputId, tbodyId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let rows = document.getElementById(tbodyId).getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        // শুধুমাত্র "নাম/বিবরণ" কলাম (index 1) এ সার্চ করা হচ্ছে
        let text = rows[i].getElementsByTagName('td')[1];
        if (text) {
            let textValue = text.innerText.toLowerCase();
            if (textValue.includes(input)) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// =========================================
// ১১. হোয়াটসঅ্যাপ শেয়ার (WhatsApp Share)
// =========================================
function shareWhatsApp(name, amount) {
    const message = `নমস্কার ${name}, গ্রাম পুজো কমিটির তরফ থেকে জানানো হচ্ছে যে, আপনার দেওয়া ${amount} টাকা সফলভাবে পুজো তহবিলে জমা হয়েছে। ধন্যবাদ! 🙏`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// =========================================
// ১২. পিডিএফ / প্রিন্ট রিপোর্ট (PDF / Print)
// =========================================
function printSection(title, containerId) {
    let tableHtml = document.getElementById(containerId).innerHTML;
    let printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>' + title + ' রিপোর্ট</title>');
    // প্রিন্ট পেজের জন্য আলাদা ডিজাইন দেওয়া হলো, যেখানে অ্যাকশন বাটনগুলো হাইড করা থাকবে
    printWindow.document.write(`
        <style>
            body { font-family: sans-serif; padding: 20px; color: black; }
            h2 { text-align: center; color: #333; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #333; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; color: black; font-weight: bold; }
            .no-print { display: none !important; } /* অ্যাকশন কলাম হাইড করার জন্য */
            .hidden { display: none !important; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>' + title + ' (' + currentYear + ' সাল)</h2>');
    printWindow.document.write(tableHtml);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    
    // পেজটা রেডি হতে একটু সময় দিয়ে প্রিন্ট ডায়লগ ওপেন করা
    setTimeout(() => {
        printWindow.print();
    }, 500);
}