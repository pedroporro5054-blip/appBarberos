const fs = require('fs').promises;
const path = require('path');
const { query, getConnection } = require('./db');

// Función para leer y ejecutar el archivo SQL
async function executeSchemaFile() {
    try {
        console.log('📖 Leyendo archivo de esquema...');
        
        // Leer el archivo schema.sql
        const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
        const schemaContent = await fs.readFile(schemaPath, 'utf8');
        
        const connection = await getConnection();
        try {
            console.log('🔧 Ejecutando todo el esquema en una sola llamada...');
            await connection.query(schemaContent);
            console.log('✅ Esquema de base de datos ejecutado correctamente');
        } catch (error) {
            console.error('❌ Error ejecutando esquema:', error.message);
            throw error;
        } finally {
            connection.release();
        }
        return true;
    } catch (error) {
        console.error('❌ Error ejecutando esquema:', error.message);
        return false;
    }
}

// Función para insertar datos de ejemplo
async function insertSampleData() {
    try {
        console.log('📝 Insertando datos de ejemplo...');
        
        const connection = await getConnection();
        
        // Verificar si ya hay datos
        const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
        
        if (existingUsers[0].count > 0) {
            console.log('⚠️  Ya existen datos en la base de datos, saltando inserción de datos de ejemplo');
            connection.release();
            return true;
        }
        
        // Leer y ejecutar el archivo de datos de ejemplo
        const sampleDataPath = path.join(__dirname, '..', 'sql', 'sample-data.sql');
        const sampleDataContent = await fs.readFile(sampleDataPath, 'utf8');
        
        // Dividir el contenido en consultas individuales
        const queries = sampleDataContent
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0 && !query.startsWith('--'));
        
        console.log(`📋 Ejecutando ${queries.length} consultas de datos de ejemplo...`);
        
        for (let i = 0; i < queries.length; i++) {
            const sql = queries[i];
            if (sql.trim()) {
                try {
                    await connection.query(sql);
                    console.log(`✅ Datos ${i + 1}/${queries.length} insertados`);
                } catch (error) {
                    console.error(`❌ Error insertando datos ${i + 1}:`, error.message);
                }
            }
        }
        
        console.log('✅ Datos de ejemplo insertados correctamente');
        console.log('📋 Credenciales de acceso:');
        console.log('   Email: admin@barberia.com');
        console.log('   Contraseña: admin123');
        
        connection.release();
        return true;
        
    } catch (error) {
        console.error('❌ Error insertando datos de ejemplo:', error.message);
        return false;
    }
}

// Función principal de inicialización
async function initializeDatabase() {
    console.log('🚀 Inicializando base de datos completa...');
    
    try {
        // Ejecutar esquema
        const schemaExecuted = await executeSchemaFile();
        if (!schemaExecuted) {
            return false;
        }
        
        // Insertar datos de ejemplo
        await insertSampleData();
        
        console.log('🎉 Base de datos inicializada completamente');
        console.log('📋 Credenciales de acceso:');
        console.log('   Email: admin@barberia.com');
        console.log('   Contraseña: admin123');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en la inicialización:', error.message);
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initializeDatabase()
        .then(success => {
            if (success) {
                console.log('✅ Inicialización completada exitosamente');
                process.exit(0);
            } else {
                console.log('❌ Error en la inicialización');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Error inesperado:', error);
            process.exit(1);
        });
}

module.exports = {
    initializeDatabase,
    executeSchemaFile,
    insertSampleData
}; 