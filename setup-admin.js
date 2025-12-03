#!/usr/bin/env node

import mongoose from "mongoose";
import readline from "readline";
import Admin from "./backend/models/Admin.js";
import { hashPassword } from "./backend/utils/validation.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAdmin() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║    QuadMatrix - Admin User Setup Wizard                ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/QuadMatrixLog");
    console.log("✓ Connected to MongoDB\n");

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ role: "super_admin" });
    if (existingAdmin) {
      console.log("⚠ Super admin already exists!");
      console.log(`  Email: ${existingAdmin.email}`);
      const reset = await question("Do you want to reset the password? (yes/no): ");
      if (reset.toLowerCase() !== "yes") {
        console.log("\nSetup cancelled.");
        process.exit(0);
      }
    }

    // Get user input
    const username = await question("Enter admin username: ");
    const email = await question("Enter admin email: ");
    const password = await question("Enter admin password: ");
    const confirmPassword = await question("Confirm password: ");

    // Validate input
    if (!username || !email || !password) {
      console.error("✗ All fields are required");
      process.exit(1);
    }

    if (username.length < 3) {
      console.error("✗ Username must be at least 3 characters");
      process.exit(1);
    }

    if (!email.includes("@")) {
      console.error("✗ Invalid email address");
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error("✗ Passwords do not match");
      process.exit(1);
    }

    if (password.length < 8) {
      console.error("✗ Password must be at least 8 characters");
      process.exit(1);
    }

    // Hash password
    console.log("\nProcessing admin data...");
    const hashedPassword = await hashPassword(password);

    // Create or update admin
    const adminData = {
      userId: `admin_${Date.now()}`,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "super_admin",
      permissions: ["read", "write", "delete", "admin"],
      isActive: true,
    };

    let admin;
    if (existingAdmin) {
      admin = await Admin.findByIdAndUpdate(
        existingAdmin._id,
        adminData,
        { new: true }
      );
      console.log("✓ Admin password reset successfully");
    } else {
      admin = await Admin.create(adminData);
      console.log("✓ Admin user created successfully");
    }

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║                  Setup Complete!                       ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`║ Admin ID: ${admin._id.toString().substring(0, 52)}...║`);
    console.log(`║ Username: ${username.padEnd(48)}║`);
    console.log(`║ Email:    ${email.padEnd(48)}║`);
    console.log(`║ Role:     Super Admin${" ".repeat(27)}║`);
    console.log("║                                                        ║");
    console.log("║ Next steps:                                            ║");
    console.log("║ 1. Start the server: npm run server:dev               ║");
    console.log("║ 2. Open browser: http://localhost:8080/login          ║");
    console.log("║ 3. Login with your credentials                        ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    process.exit(0);
  } catch (error) {
    console.error("✗ Setup error:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n⚠ MongoDB is not running!");
      console.error("  Start MongoDB with: mongod --dbpath 'C:\\data\\db'");
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupAdmin();
