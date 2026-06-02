import mysql from "mysql2/promise"; 
 
const createConnection = async () => { 
  try { 
    const connection = await mysql.createConnection({ 
      host: "localhost", 
      user: "Prasanna", 
      password: "2006", 
      database: "merchantmind", 
    }); 
    console.log("Database connected successfully"); 
    return connection; 
  } catch (error) { 
    console.error("Database connection failed:", error.message); 
    process.exit(1); 
  } 
}; 
 
const db = await createConnection(); 
 
export default db; 
