const fs = require('fs');

const path = 'public/equipment.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Hook up the edit button
content = content.replace(
    `<button class="action-btn" title="Chỉnh sửa" onclick="event.stopPropagation();"><i class="fa-regular fa-pen-to-square"></i></button>`,
    `<button class="action-btn" title="Chỉnh sửa" onclick="event.stopPropagation(); openEditModal(\${eq.id})"><i class="fa-regular fa-pen-to-square"></i></button>`
);

// 2. Extract and create Edit Modal
const addModalRegex = /<!-- Modal Thêm Thiết Bị -->[\s\S]*?(?=<!-- Modal Xem Lịch Sử Sửa Chữa -->)/;
const match = content.match(addModalRegex);

if (match && !content.includes('id="editModal"')) {
    let addModalHtml = match[0];
    let editModalHtml = addModalHtml
        .replace('<!-- Modal Thêm Thiết Bị -->', '<!-- Modal Chỉnh Sửa Thiết Bị -->')
        .replace('id="addModal"', 'id="editModal"')
        .replace('Thêm Thiết Bị Mới', 'Chỉnh Sửa Thiết Bị')
        .replace('Điền thông tin chi tiết thiết bị để đưa vào hệ thống quản lý', 'Cập nhật lại thông tin thiết bị đang có trên hệ thống')
        .replace('onclick="closeModal()"', 'onclick="closeEditModal()"')
        .replace(/onclick="closeModal\(\)"/g, 'onclick="closeEditModal()"')
        .replace('id="addForm"', 'id="editForm"')
        .replace(/id="add_/g, 'id="edit_')
        .replace('id="customDepartmentSelect"', 'id="customEditDepartmentSelect"')
        .replace('id="customDepartmentText"', 'id="customEditDepartmentText"')
        .replace('id="customDepartmentOptions"', 'id="customEditDepartmentOptions"')
        .replace(/onclick="this\.parentElement\.classList\.toggle\('open'\)"/g, 'onclick="this.parentElement.classList.toggle(\\\'open\\\')"')
        // Some manual replacements to avoid parsing issues, though simple string replace should work if we are careful
        .replace('Lưu Thiết Bị', 'Cập Nhật Lại')
        .replace('<i class="fa-solid fa-laptop-medical"></i>', '<i class="fa-solid fa-pen-to-square"></i>');
    
    // Fix single quotes for JS functions inside the edit modal HTML
    editModalHtml = editModalHtml.replace(/onclick="this\.parentElement\.classList\.toggle\('open'\)"/g, `onclick="this.parentElement.classList.toggle('open')"`);

    content = content.replace(match[0], match[0] + '\n' + editModalHtml);
}

// 3. Add JS Logic for Edit
const jsLogic = `
        var currentEditId = null;

        function openEditModal(id) {
            const eq = allEquipments.find(e => e.id === id);
            if (!eq) return;
            currentEditId = id;

            document.getElementById('edit_name').value = eq.name || '';
            document.getElementById('edit_category').value = eq.category || 'Laptop';
            document.getElementById('edit_status').value = eq.status || 'Sẵn sàng';
            document.getElementById('edit_cpu').value = eq.cpu || '';
            document.getElementById('edit_ram').value = eq.ram || '';
            document.getElementById('edit_rom').value = eq.rom || '';
            if(document.getElementById('edit_os')) document.getElementById('edit_os').value = eq.os || '';
            document.getElementById('edit_monitor').value = eq.monitor || '';
            document.getElementById('edit_mouse').value = eq.mouse || '';
            document.getElementById('edit_keyboard').value = eq.keyboard || '';
            document.getElementById('edit_assigned').value = eq.assigned_to || '';
            
            document.getElementById('edit_department').value = eq.department || '';
            var deptText = document.getElementById('customEditDepartmentText');
            if (deptText) {
                deptText.textContent = eq.department || '-- Chọn phòng ban / dự án --';
                deptText.style.color = eq.department ? 'var(--dark)' : '#cbd5e1';
            }
            
            document.getElementById('edit_repair').value = eq.repair_history || '';

            document.getElementById('editModal').classList.add('active');
        }

        function closeEditModal() {
            currentEditId = null;
            document.getElementById('editModal').classList.remove('active');
            document.getElementById('editForm').reset();
            const opts = document.getElementById('customEditDepartmentOptions');
            if (opts) Array.from(opts.children).forEach(c => c.classList.remove('selected'));
        }

        document.getElementById('editForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!currentEditId) return;

            var btn = e.target.querySelector('button[type="submit"]');
            var originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            btn.disabled = true;

            var payload = {
                name: document.getElementById('edit_name').value.trim(),
                category: document.getElementById('edit_category').value,
                status: document.getElementById('edit_status').value,
                cpu: document.getElementById('edit_cpu').value.trim(),
                ram: document.getElementById('edit_ram').value.trim(),
                rom: document.getElementById('edit_rom').value.trim(),
                monitor: document.getElementById('edit_monitor').value.trim(),
                mouse: document.getElementById('edit_mouse').value.trim(),
                keyboard: document.getElementById('edit_keyboard').value.trim(),
                assigned_to: document.getElementById('edit_assigned').value.trim(),
                department: document.getElementById('edit_department').value.trim(),
                repair_history: document.getElementById('edit_repair').value.trim(),
                os: document.getElementById('edit_os') ? document.getElementById('edit_os').value.trim() : ''
            };
            
            try {
                const res = await fetch('/api/equipments/' + currentEditId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(data.status === 'ok') {
                    closeEditModal();
                    showToast('Đã lưu!', 'Cập nhật thông tin thành công.', 'success');
                    loadData(); // reload table
                } else {
                    alert(data.message || 'Lỗi cập nhật thiết bị');
                }
            } catch (err) {
                alert('Lỗi kết nối máy chủ');
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });
`;

if (!content.includes('function openEditModal')) {
    content = content.replace(
        `document.getElementById('addForm').addEventListener('submit', async (e) => {`,
        jsLogic + `\n        document.getElementById('addForm').addEventListener('submit', async (e) => {`
    );
}

// Need to update loadDepartments to populate edit form
if (!content.includes('document.getElementById(\'edit_department\').value = dep.name;')) {
    content = content.replace(
        /optionsContainer\.appendChild\(opt\);\s*\n/g,
        `optionsContainer.appendChild(opt);
                            
                            // Edit Form Options
                            const eOpt = document.createElement('div');
                            eOpt.className = 'custom-option';
                            eOpt.innerHTML = \`<i class="fa-regular fa-building" style="color:var(--primary); width: 22px;"></i> \${dep.name}\`;
                            eOpt.onclick = () => {
                                document.getElementById('edit_department').value = dep.name;
                                document.getElementById('customEditDepartmentText').textContent = dep.name;
                                document.getElementById('customEditDepartmentText').style.color = 'var(--dark)';
                                const eOptsCnt = document.getElementById('customEditDepartmentOptions');
                                if(eOptsCnt) {
                                    Array.from(eOptsCnt.children).forEach(c => c.classList.remove('selected'));
                                }
                                eOpt.classList.add('selected');
                                document.getElementById('customEditDepartmentSelect').classList.remove('open');
                            };
                            const eOptsContainer = document.getElementById('customEditDepartmentOptions');
                            if(eOptsContainer) eOptsContainer.appendChild(eOpt);
\n`
    );
    
    // Add empty option for edit
    content = content.replace(
        `optionsContainer.appendChild(emptyOpt);`,
        `optionsContainer.appendChild(emptyOpt);
                        
                        const eEmptyOpt = document.createElement('div');
                        eEmptyOpt.className = 'custom-option';
                        eEmptyOpt.innerHTML = \`<i class="fa-solid fa-minus" style="color:var(--gray-light); width: 22px;"></i> <em style="color:var(--gray);">-- Để trống --</em>\`;
                        eEmptyOpt.onclick = () => {
                            document.getElementById('edit_department').value = '';
                            document.getElementById('customEditDepartmentText').textContent = '-- Chọn phòng ban / dự án --';
                            document.getElementById('customEditDepartmentText').style.color = '#cbd5e1';
                            const eOptsCnt = document.getElementById('customEditDepartmentOptions');
                            if(eOptsCnt) Array.from(eOptsCnt.children).forEach(c => c.classList.remove('selected'));
                            eEmptyOpt.classList.add('selected');
                            document.getElementById('customEditDepartmentSelect').classList.remove('open');
                        };
                        const eOptsContainer = document.getElementById('customEditDepartmentOptions');
                        if (eOptsContainer) eOptsContainer.appendChild(eEmptyOpt);`
    );
}

// Also close edit custom select when clicking outside
if (!content.includes(`if (editDepSelect && !editDepSelect.contains(e.target)) editDepSelect.classList.remove('open');`)) {
    content = content.replace(
        `if (depSelect && !depSelect.contains(e.target)) depSelect.classList.remove('open');`,
        `if (depSelect && !depSelect.contains(e.target)) depSelect.classList.remove('open');
            var editDepSelect = document.getElementById('customEditDepartmentSelect');
            if (editDepSelect && !editDepSelect.contains(e.target)) editDepSelect.classList.remove('open');`
    );
}


fs.writeFileSync(path, content, 'utf8');
console.log('Script patched public/equipment.html successfully');
