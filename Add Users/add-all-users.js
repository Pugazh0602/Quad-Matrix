#!/usr/bin/env node

import mongoose from "mongoose";
// Ensure these paths are correct relative to where you run this script
import User from "./backend/models/User.js";
import { hashPassword } from "./backend/utils/validation.js";

// Define the list of users to add.
const usersToAdd = [
  { email: "dharani@quadmatrix.in", firstName: "Dharani", lastName: "R" },
  { email: "jayasri@quadmatrix.in", firstName: "Jayasri", lastName: "M" },
  { email: "pavithra@quadmatrix.in", firstName: "Pavithra", lastName: "G" },
  { email: "nivetha@quadmatrix.in", firstName: "Nivetha", lastName: "B" },
  { email: "sakthiabirami@quadmatrix.in", firstName: "Sakthiabirami", lastName: "R" },
  { email: "srivarshini@quadmatrix.in", firstName: "Srivarshini", lastName: "S" },
  { email: "sarojini@quadmatrix.in", firstName: "Sarojini", lastName: "S" },
  { email: "varalakshmi@quadmatrix.in", firstName: "Varalakshmi", lastName: "S" },
  { email: "kaushal@quadmatrix.in", firstName: "Kaushal", lastName: "C" },
  { email: "dharshini@quadmatrix.in", firstName: "Dharshini", lastName: "R" },
  { email: "chitra@quadmatrix.in", firstName: "Chitra", lastName: "T" },
  { email: "Pavithra.a@quadmatrix.in", firstName: "Pavithra", lastName: "A" },
  { email: "harish@quadmatrix.in", firstName: "Harish", lastName: "S" },
  { email: "pugazh@quadmatrix.in", firstName: "Pukahendhi", lastName: "R" },
];

async function addUsers() {
  console.log("\n--- QuadMatrix - Bulk User Setup (Password = Email) ---\n");
  const successfullyCreatedUsers = [];

  try {
    console.log("Connecting to MongoDB...");
    // Update the MongoDB connection string if necessary
    await mongoose.connect("mongodb://localhost:27017/QuadMatrixLog");
    console.log("✓ Connected to MongoDB\n");

    for (const userData of usersToAdd) {
      const emailLower = userData.email.toLowerCase();
      // !!! WARNING: The password is set to be the email address !!!
      const password = emailLower; 

      try {
        const existing = await User.findOne({ email: emailLower });
        if (existing) {
          console.log(`  [SKIP] User ${emailLower} already exists.`);
          continue;
        }

        // We still hash the email string before saving it to the DB
        const hashedPassword = await hashPassword(password); 

        const newUser = await User.create({
          email: emailLower,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: "user",
          isActive: true,
        });

        console.log(`  [OK] Created user: ${newUser.email}`);
        // Store email and "password" (which is the email) to print later
        successfullyCreatedUsers.push({ email: newUser.email, password: password });

      } catch (err) {
        console.error(`  [FAIL] Could not create user ${emailLower}: ${err.message}`);
      }
    }

    console.log("\n✓ Bulk user creation process finished.\n");
    
    if (successfullyCreatedUsers.length > 0) {
      console.log("--- User Credentials (Password = Email Address) ---");
      for (const user of successfullyCreatedUsers) {
        console.log(`* Email: ${user.email} | **Password: ${user.password}**`);
      }
      console.log("---------------------------------------------------\n");
    }

    process.exit(0);

  } catch (err) {
    console.error("✗ Global setup error:", err.message || err);
    if (err.message && err.message.includes("ECONNREFUSED")) {
      console.error("MongoDB is not running. Start it with: mongod --dbpath 'C:\\data\\db'");
    }
    process.exit(1);
  }
}

addUsers();
