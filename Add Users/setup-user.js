#!/usr/bin/env node

import mongoose from "mongoose";
import readline from "readline";
import User from "./backend/models/User.js";
import { hashPassword } from "./backend/utils/validation.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function setupUser() {
  console.log("\n--- QuadMatrix - Employee User Setup ---\n");

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/QuadMatrixLog");
    console.log("✓ Connected to MongoDB\n");

    const email = (await question("Enter employee email: ")).trim();
    const firstName = (await question("Enter first name: ")).trim();
    const lastName = (await question("Enter last name: ")).trim();
    const password = await question("Enter password (min 8 chars): ");
    const confirm = await question("Confirm password: ");

    if (!email || !password) {
      console.error("✗ Email and password are required");
      process.exit(1);
    }

    if (password !== confirm) {
      console.error("✗ Passwords do not match");
      process.exit(1);
    }

    if (password.length < 8) {
      console.error("✗ Password must be at least 8 characters");
      process.exit(1);
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.error(`✗ A user with email ${email} already exists.`);
      process.exit(1);
    }

    console.log("Hashing password...");
    const hashed = await hashPassword(password);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      firstName,
      lastName,
      role: "user",
      isActive: true,
    });

    console.log("\n✓ Employee user created successfully:\n");
    console.log(`  ID: ${user._id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.firstName || ""} ${user.lastName || ""}`);
    console.log(`  Role: ${user.role}`);
    console.log("\nNext: start server (npm run server:dev) and login via the app or API.\n");

    process.exit(0);
  } catch (err) {
    console.error("✗ Setup error:", err.message || err);
    if (err.message && err.message.includes("ECONNREFUSED")) {
      console.error("MongoDB is not running. Start it with: mongod --dbpath 'C:\\data\\db'");
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupUser();
