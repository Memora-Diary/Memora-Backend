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
      latestPost DATE,
      invalidUser BOOL
    )`,
    (err) => {
      if (err) {
        console.error("Error creating USERS table", err);
      } else {
        console.log("USERS table created successfully");
      }
    }
  );

  // Create TRIGGERS table with triggerID as primary key
  db.run(
    `CREATE TABLE IF NOT EXISTS TRIGGERS (
      triggerID INTEGER PRIMARY KEY,
      postID INTEGER NOT NULL,
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

function getUsersByIds(userIds) {
  return new Promise((resolve, reject) => {
    // Convert the array of userIds into a comma-separated string
    const placeholders = userIds.map(() => "?").join(",");
    const query = `SELECT * FROM USERS WHERE userID IN (${placeholders})`;

    db.all(query, userIds, (err, rows) => {
      if (err) {
        console.error("Error retrieving users", err);
        reject(err);
      } else {
        console.log(`Retrieved ${rows.length} users`);
        resolve(rows);
      }
    });
  });
}

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    userId = Number(userId);
    const query = "SELECT * FROM USERS WHERE userID = ?";

    db.get(query, userId, (err, row) => {
      if (err) {
        console.error("Error retrieving user", err);
        reject(err);
      } else if (row) {
        console.log(`Retrieved user with ID: ${userId}`);
        resolve(row);
      } else {
        console.log(`No user found with ID: ${userId}`);
        resolve(null);
      }
    });
  });
}

// Function to insert or update a user
function upsertUser(userID, latestPost) {
  userID = Number(userID);

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

// Function to insert or update a trigger
// function upsertTrigger(triggerID, postID, userID) {
//   const stmt = db.prepare(
//     "INSERT OR REPLACE INTO TRIGGERS (triggerID, postID, userID) VALUES (?, ?, ?)"
//   );
//   stmt.run(triggerID, postID, userID, function (err) {
//     if (err) {
//       console.error("Error upserting trigger", err);
//     } else {
//       console.log(`Trigger upserted with triggerID: ${triggerID}`);
//     }
//   });
//   stmt.finalize();
// }

function upsertTrigger(postId, userId) {
  return new Promise((resolve, reject) => {
    // First, check if a trigger already exists
    postId = Number(postId);
    userId = Number(userId);
    const checkQuery =
      "SELECT triggerID FROM TRIGGERS WHERE postID = ? AND userID = ?";

    db.get(checkQuery, [postId, userId], (err, row) => {
      if (err) {
        console.error("Error checking existing trigger", err);
        reject(err);
        return;
      }

      if (row) {
        // Trigger already exists, return the existing triggerId
        console.log(`Existing trigger found with ID: ${row.triggerID}`);
        resolve(row.triggerID);
      } else {
        // No existing trigger, insert a new one
        const insertQuery =
          "INSERT INTO TRIGGERS (postID, userID) VALUES (?, ?)";

        db.run(insertQuery, [postId, userId], function (err) {
          if (err) {
            console.error("Error inserting new trigger", err);
            reject(err);
          } else {
            const newTriggerId = this.lastID;
            console.log(`New trigger inserted with ID: ${newTriggerId}`);
            resolve(newTriggerId);
          }
        });
      }
    });
  });
}

// Function to delete a trigger
function deleteTrigger(triggerID) {
  const stmt = db.prepare("DELETE FROM TRIGGERS WHERE triggerID = ?");
  stmt.run(triggerID, function (err) {
    if (err) {
      console.error("Error deleting trigger", err);
    } else {
      console.log(`Trigger deleted. Rows affected: ${this.changes}`);
    }
  });
  stmt.finalize();
}

// Function to flag invalid user
  function flagInvalidUser(userID) {
    const stmt = db.prepare("UPDATE USERS SET invalidUser = 1 WHERE userID = ?");
    
    // Execute the statement, passing in the userID
    stmt.run(userID, function (err) {
      if (err) {
        console.error("Error updating user", err);
      } else {
        console.log(`User flagged as invalid. Rows affected: ${this.changes}`);
      }
    });
    
    // Finalize the statement
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

// getUserById(855266).then((results) => {
//   console.log(results ? results.latestPost > 0 : false);
// });

module.exports = {
  upsertUser,
  upsertTrigger,
  deleteTrigger,
  getUserById,
  getUsersByIds,
  flagInvalidUser
};
