const fs = require('fs');

const files = ['src/pages/DetalleVenta.jsx', 'src/pages/DetalleCompra.jsx'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add useAuth import
    if (!content.includes('../context/AuthContext')) {
        content = content.replace(/import React,[^\n]*/, match => match + '\nimport { useAuth } from "../context/AuthContext";');
    }

    // Add currentUser, canEdit
    if (!content.includes('useAuth();')) {
        content = content.replace(/const navigate = useNavigate\(\);/, 'const navigate = useNavigate();\n    const { currentUser } = useAuth();\n    const canEdit = currentUser && (currentUser.rol === "SUPERADMIN" || currentUser.rol === "ADMIN");');
    }

    // Add effect for redirecting if !canEdit and new
    if (!content.includes('No tienes permisos')) {
        content = content.replace(/useEffect\(\(\) => \{/, 'useEffect(() => {\n        if (!canEdit && !isEditMode) {\n            toast.error("No tienes permisos para crear.");\n            navigate(-1);\n            return;\n        }');
    }

    // Replace disabled={isSaving} with disabled={isSaving || !canEdit}
    content = content.replace(/disabled=\{isSaving\}/g, 'disabled={isSaving || !canEdit}');
    
    // Replace disabled={isSaving || item.isExistingInventoryItem} 
    content = content.replace(/disabled=\{isSaving \|\| item.isExistingInventoryItem\}/g, 'disabled={isSaving || !canEdit || item.isExistingInventoryItem}');

    // Hide Save Button
    content = content.replace(/<button[^>]*onClick=\{triggerSave\}[^>]*>[\s\S]*?<\/button>/g, match => '{canEdit && (\n' + match + '\n)}');
    content = content.replace(/<button[^>]*onClick=\{handleSave\}[^>]*>[\s\S]*?<\/button>/g, match => '{canEdit && (\n' + match + '\n)}');

    // Hide Add Item Button
    content = content.replace(/<button onClick=\{addItem\}[^>]*>[\s\S]*?<\/button>/g, match => '{canEdit && (\n' + match + '\n)}');

    // Hide Remove Item Button
    content = content.replace(/<button onClick=\{\(\) => removeItem\([^>]*\)\}[^>]*>[\s\S]*?<\/button>/g, match => '{canEdit && (\n' + match + '\n)}');

    fs.writeFileSync(file, content);
    console.log(file + ' updated');
});
