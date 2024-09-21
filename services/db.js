const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./memora.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected");
    createTables();
  }
});

function createTables() {
  // Create USERS table
  db.run(
    `CREATE TABLE IF NOT EXISTS USERS (
      userID INTEGER PRIMARY KEY,
      latestPost DATE
    )`,
    (err) => {
      if (err) {
        console.error("Error creating USERS table", err);
      } else {
        console.log("USERS table created successfully");
      }
    }
  );

  // Create TRIGGERS table
  db.run(
    `CREATE TABLE IF NOT EXISTS TRIGGERS (
      postID INTEGER PRIMARY KEY,
      triggerID INTEGER NOT NULL,
      userID INTEGER,
      FOREIGN KEY (userID) REFERENCES USERS (userID)
    )`,
    (err) => {
      if (err) {
        console.error("Error creating TRIGGERS table", err);
      } else {
        console.log("TRIGGERS table created successfully");
      }
    }
  );
}

// Function to insert or update a user
function upsertUser(userID, latestPost) {
  const stmt = db.prepare(`
      INSERT OR REPLACE INTO USERS (userID, latestPost)
      VALUES (?, ?)
    `);

  stmt.run(userID, latestPost, function (err) {
    if (err) {
      console.error("Error upserting user", err);
    } else {
      console.log(`User upserted with ID: ${userID}`);
    }
  });
  stmt.finalize();
}

// Function to insert a trigger
function insertTrigger(postID, triggerID, userID) {
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO TRIGGERS (postID, triggerID, userID) VALUES (?, ?, ?)"
  );
  stmt.run(postID, triggerID, userID, function (err) {
    if (err) {
      console.error("Error inserting trigger", err);
    } else {
      console.log(`Trigger inserted with postID: ${postID}`);
    }
  });
  stmt.finalize();
}

// Function to delete a trigger
function deleteTrigger(postID) {
  const stmt = db.prepare("DELETE FROM TRIGGERS WHERE postID = ?");
  stmt.run(postID, function (err) {
    if (err) {
      console.error("Error deleting trigger", err);
    } else {
      console.log(`Trigger deleted. Rows affected: ${this.changes}`);
    }
  });
  stmt.finalize();
}

// Don't forget to close the database connection when your app is shutting down
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Database connection closed");
    process.exit(0);
  });
});
