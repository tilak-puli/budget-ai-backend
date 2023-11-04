const { MongoClient } = require("mongodb");
const connectionString = process.env.ATLAS_URI || "";
const client = new MongoClient(connectionString);

let db;

const createConnection = async () => {
  let conn;
  try {
    conn = await client.connect();
  } catch (e) {
    console.error(e);
  }

  db = conn.db("finance");
  console.log("Connected to database")
};

createConnection();

const getDb = () => {
  return db;
}

module.exports = { getDb };
