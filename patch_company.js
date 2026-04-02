const fs = require('fs');

function cloneConfig() {
    let content = fs.readFileSync('public/config.html', 'utf8');

    // 1. Rename page title
    content = content.replace('Cấu Hình Phòng Ban & Dự Án', 'Cấu Hình Công Ty & Phòng Ban');
    
    // 2. Clone the table block
    const tableRegex = /<div class="table-card fade-in-up delay-1">[\s\S]*?<\/div>\s*<\/main>/;
    const match = content.match(tableRegex);
    if (match) {
        let deptBlock = match[0].replace('</main>', '');
        let compBlock = deptBlock
            .replace('danh sách các phòng ban và dự án', 'danh sách các công ty')
            .replace('Tên Phòng Ban / Dự Án', 'Tên Công Ty')
            .replace('departmentsBody', 'companiesBody')
            .replace('delay-1', 'delay-2')
            .replace(/openModal(?=\(\))/g, 'openCompanyModal');
            
        deptBlock = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; margin-top: 30px;" class="fade-in-up delay-1"><h2><i class="fa-solid fa-sitemap" style="color:var(--primary); margin-right:8px;"></i> Phòng Ban & Dự Án</h2><button class="btn-primary" onclick="openModal()"><i class="fa-solid fa-plus"></i> Thêm Phòng Ban</button></div>' + deptBlock.replace('delay-1', '');
        
        compBlock = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;" class="fade-in-up"><h2><i class="fa-solid fa-building" style="color:var(--primary); margin-right:8px;"></i> Công Ty</h2><button class="btn-primary" onclick="openCompanyModal()"><i class="fa-solid fa-plus"></i> Thêm Công Ty</button></div>' + compBlock;

        content = content.replace(/<button class="btn-primary" onclick="openModal\(\)">[\s\S]*?<\/button>/, '');
        
        content = content.replace(match[0], compBlock + deptBlock + '</main>');
    }

    // 3. Clone Modal Thêm
    const addModalRegex = /<!-- Modal Thêm -->[\s\S]*?(?=<!-- Modal Xoá)/;
    const modalMatch = content.match(addModalRegex);
    if (modalMatch && !content.includes('addCompanyModal')) {
        let compModal = modalMatch[0]
            .replace('id="addModal"', 'id="addCompanyModal"')
            .replace('Tạo phòng ban hoặc dự án mới', 'Thêm công ty đối tác hoặc tổ chức mới')
            .replace('Tên Phòng ban / Dự án', 'Tên Công Ty')
            .replace('Phòng IT / Dự án Alpha', 'Công ty TNHH ABC')
            .replace(/closeModal\(\)/g, 'closeCompanyModal()')
            .replace('id="addForm"', 'id="addCompanyForm"')
            .replace('id="add_name"', 'id="add_company_name"')
            .replace('id="add_desc"', 'id="add_company_desc"');
        content = content.replace(modalMatch[0], modalMatch[0] + '\n' + compModal);
    }

    // 4. Update JS logic
    let jsBlock = `
        var targetCompanyId = null;

        function openCompanyModal() {
            document.getElementById('addCompanyModal').classList.add('active');
        }

        function closeCompanyModal() {
            document.getElementById('addCompanyModal').classList.remove('active');
            document.getElementById('addCompanyForm').reset();
        }

        async function loadCompanies() {
            try {
                const res = await fetch('/api/companies');
                const data = await res.json();
                if (data.status === 'ok') {
                    renderCompanies(data.data);
                }
            } catch (err) {}
        }

        function renderCompanies(data) {
            const tbody = document.getElementById('companiesBody');
            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:30px;">Chưa có công ty nào</td></tr>';
                return;
            }
            tbody.innerHTML = data.map((item, i) => {
                const date = new Date(item.created_at).toLocaleDateString('vi-VN');
                return '<tr>' +
                        '<td style="text-align: center; color: var(--gray);">' + (i+1) + '</td>' +
                        '<td style="font-weight: 500; color: var(--dark);"><div style="display:flex; align-items:center;"><i class="fa-solid fa-building" style="color:var(--primary); margin-right:8px;"></i> ' + item.name + '</div></td>' +
                        '<td style="color: var(--gray); font-size: 0.9rem;">' + (item.description || '-') + '</td>' +
                        '<td>' + date + '</td>' +
                        '<td style="text-align: center;">' +
                            '<button class="action-btn delete" onclick="openDeleteCompanyModal(' + item.id + ')"><i class="fa-regular fa-trash-can"></i></button>' +
                        '</td>' +
                    '</tr>';
            }).join('');
        }

        document.addEventListener('DOMContentLoaded', () => {
            const addCompanyForm = document.getElementById('addCompanyForm');
            if (addCompanyForm) {
                addCompanyForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    var payload = {
                        name: document.getElementById('add_company_name').value.trim(),
                        description: document.getElementById('add_company_desc').value.trim()
                    };
                    try {
                        const res = await fetch('/api/companies', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(payload)
                        });
                        const data = await res.json();
                        if (data.status === 'ok') {
                            closeCompanyModal();
                            loadCompanies();
                        } else {
                            alert(data.message);
                        }
                    } catch (err) {
                        alert('Lỗi lưu công ty');
                    }
                });
            }
        });

        function openDeleteCompanyModal(id) {
            targetCompanyId = id;
            document.getElementById('deleteModal').classList.add('active'); // reuse delete modal
            const cBtn = document.getElementById('confirmDeleteBtn');
            cBtn.onclick = async () => {
                const bText = cBtn.innerHTML;
                cBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Chờ...';
                try {
                    const res = await fetch('/api/companies/' + targetCompanyId, { method: 'DELETE' });
                    const data = await res.json();
                    if(data.status === 'ok') loadCompanies();
                } catch(e) {}
                closeDeleteModal();
                cBtn.innerHTML = bText;
                cBtn.onclick = null;
            }
        }
    `;

    if (!content.includes('loadCompanies()')) {
        content = content.replace('loadData();', 'loadData();\nloadCompanies();' + jsBlock);
    }

    fs.writeFileSync('public/config.html', content, 'utf8');
}

function cloneEquipmentSelects() {
    let html = fs.readFileSync('public/equipment.html', 'utf8');
    
    const r1 = /<input type="text" id="add_company"[^>]*>[\s\S]*?<i[^>]*><\/i>/;
    const s1 = '<input type="hidden" id="add_company">' +
               '<div class="custom-select" id="customCompanySelect">' +
               '<div class="custom-select-trigger" onclick="this.parentElement.classList.toggle(\'open\')">' +
               '<i class="fa-solid fa-building" style="color: var(--gray-light); margin-right: 12px; font-size: 1rem;"></i>' +
               '<span id="customCompanyText" style="flex: 1; color: #cbd5e1;">-- Chọn công ty --</span>' +
               '<i class="fa-solid fa-chevron-down arrow-icon"></i>' +
               '</div>' +
               '<div class="custom-options" id="customCompanyOptions">' +
               '</div>' +
               '</div>';
    
    html = html.replace(r1, s1);

    const r2 = /<input type="text" id="edit_company"[^>]*>[\s\S]*?<i[^>]*><\/i>/;
    const s2 = '<input type="hidden" id="edit_company">' +
               '<div class="custom-select" id="customEditCompanySelect">' +
               '<div class="custom-select-trigger" onclick="this.parentElement.classList.toggle(\'open\')">' +
               '<i class="fa-solid fa-building" style="color: var(--gray-light); margin-right: 12px; font-size: 1rem;"></i>' +
               '<span id="customEditCompanyText" style="flex: 1; color: #cbd5e1;">-- Chọn công ty --</span>' +
               '<i class="fa-solid fa-chevron-down arrow-icon"></i>' +
               '</div>' +
               '<div class="custom-options" id="customEditCompanyOptions">' +
               '</div>' +
               '</div>';
                                    
    html = html.replace(r2, s2);

    if (!html.includes('loadCompanies()')) {
        const fetchCode = `
        async function loadCompanies() {
            try {
                const res = await fetch('/api/companies');
                const result = await res.json();
                if(result.status === 'ok') {
                    const companies = result.data;
                    
                    const addOpts = document.getElementById('customCompanyOptions');
                    const editOpts = document.getElementById('customEditCompanyOptions');
                    if(addOpts) addOpts.innerHTML = '';
                    if(editOpts) editOpts.innerHTML = '';
                    
                    const emptyOpt = document.createElement('div');
                    emptyOpt.className = 'custom-option';
                    emptyOpt.innerHTML = '<i class="fa-solid fa-minus" style="color:var(--gray-light); width: 22px;"></i> <em style="color:var(--gray);">-- Để trống --</em>';
                    emptyOpt.onclick = () => {
                        document.getElementById('add_company').value = '';
                        document.getElementById('customCompanyText').textContent = '-- Chọn công ty --';
                        document.getElementById('customCompanyText').style.color = '#cbd5e1';
                        if(addOpts) Array.from(addOpts.children).forEach(c => c.classList.remove('selected'));
                        emptyOpt.classList.add('selected');
                        document.getElementById('customCompanySelect').classList.remove('open');
                    };
                    if(addOpts) addOpts.appendChild(emptyOpt);
                    
                    const eEmptyOpt = document.createElement('div');
                    eEmptyOpt.className = 'custom-option';
                    eEmptyOpt.innerHTML = '<i class="fa-solid fa-minus" style="color:var(--gray-light); width: 22px;"></i> <em style="color:var(--gray);">-- Để trống --</em>';
                    eEmptyOpt.onclick = () => {
                        document.getElementById('edit_company').value = '';
                        document.getElementById('customEditCompanyText').textContent = '-- Chọn công ty --';
                        document.getElementById('customEditCompanyText').style.color = '#cbd5e1';
                        if(editOpts) Array.from(editOpts.children).forEach(c => c.classList.remove('selected'));
                        eEmptyOpt.classList.add('selected');
                        document.getElementById('customEditCompanySelect').classList.remove('open');
                    };
                    if(editOpts) editOpts.appendChild(eEmptyOpt);

                    for(let i=0; i<companies.length; i++) {
                        let c = companies[i];
                        
                        let aOpt = document.createElement('div');
                        aOpt.className = 'custom-option';
                        aOpt.innerHTML = '<i class="fa-regular fa-building" style="color:var(--primary); width:22px;"></i> ' + c.name;
                        aOpt.onclick = () => {
                            document.getElementById('add_company').value = c.name;
                            document.getElementById('customCompanyText').textContent = c.name;
                            document.getElementById('customCompanyText').style.color = 'var(--dark)';
                            if(addOpts) Array.from(addOpts.children).forEach(ch => ch.classList.remove('selected'));
                            aOpt.classList.add('selected');
                            document.getElementById('customCompanySelect').classList.remove('open');
                        };
                        if(addOpts) addOpts.appendChild(aOpt);
                        
                        let eOpt = document.createElement('div');
                        eOpt.className = 'custom-option';
                        eOpt.innerHTML = '<i class="fa-regular fa-building" style="color:var(--primary); width:22px;"></i> ' + c.name;
                        eOpt.onclick = () => {
                            document.getElementById('edit_company').value = c.name;
                            document.getElementById('customEditCompanyText').textContent = c.name;
                            document.getElementById('customEditCompanyText').style.color = 'var(--dark)';
                            if(editOpts) Array.from(editOpts.children).forEach(ch => ch.classList.remove('selected'));
                            eOpt.classList.add('selected');
                            document.getElementById('customEditCompanySelect').classList.remove('open');
                        };
                        if(editOpts) editOpts.appendChild(eOpt);
                    }
                }
            } catch(e){}
        }
        loadCompanies();
        `;
        html = html.replace('loadDepartments();', 'loadDepartments();\n' + fetchCode);
    }
    
    if (!html.includes('if (cSelect && !cSelect')) {
        html = html.replace("document.addEventListener('click', (e) => {", 
            "document.addEventListener('click', (e) => {\n            var cSelect = document.getElementById('customCompanySelect'); if (cSelect && !cSelect.contains(e.target)) cSelect.classList.remove('open');\n            var ecSelect = document.getElementById('customEditCompanySelect'); if (ecSelect && !ecSelect.contains(e.target)) ecSelect.classList.remove('open');"
        );
    }

    fs.writeFileSync('public/equipment.html', html, 'utf8');
}

cloneConfig();
cloneEquipmentSelects();
console.log('patched config and selects!');
