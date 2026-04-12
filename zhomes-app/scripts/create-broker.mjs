import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno locales
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("No se encontraron las variables de entorno de Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBroker() {
  console.log("Iniciando creación de cuenta Broker Admin...");
  
  // Create user in auth.users
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'zhomesreapp@gmail.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Gilbert Zaldivar',
      role: 'broker',
      admin: true
    }
  });

  if (error) {
    if (error.message.includes('User already registered')) {
        console.log("El usuario zhomesreapp@gmail.com ya existe. Actualizando metadata...");
        
        // Obtener el usuario existente
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) return console.error(listError);
        
        const user = listData.users.find(u => u.email === 'zhomesreapp@gmail.com');
        if (user) {
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                password: 'Password123!',
                user_metadata: {
                  full_name: 'Gilbert Zaldivar',
                  role: 'broker',
                  admin: true
                }
            });
            if (updateError) console.error("Error actualizando: ", updateError);
            else console.log("Usuario actualizado con éxito:", updateData.user.id);
        }
    } else {
        console.error("Error creando el usuario:", error);
    }
  } else {
    console.log("¡Usuario Broker creado con éxito!");
    console.log(`ID: ${data.user.id}`);
    console.log(`Email: ${data.user.email}`);
  }
}

createBroker();
