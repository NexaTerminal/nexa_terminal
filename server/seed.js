const express = require("express");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import sample data
const sampleNews = require("./data/news.json");
const sampleInvestments = require("./data/investments.json");
const sampleUsers = require("./data/users.json");
const sampleCompanies = require("./data/companies.json");

// MongoDB Connection URI
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/nexa";

// Seed database function
async function seedDatabase() {
  try {
    await connectDB();
    
    // Check if users already exist
    const usersCount = await User.countDocuments();
    const companiesCount = await Company.countDocuments();
    const investmentsCount = await Investment.countDocuments();
    
    if (usersCount > 0) {
      // Don't proceed if users exist
      return;
    }
    
    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Investment.deleteMany({});
    
    // Insert sample data
    const sampleUsers = [
      {
        username: 'admin',
        email: 'admin@nexa.com',
        password: 'admin123',
        role: 'admin',
        profileComplete: true,
        isVerified: true
      },
      {
        username: 'user1',
        email: 'user1@nexa.com',
        password: 'user123',
        role: 'user',
        profileComplete: false,
        isVerified: false
      }
    ];
    
    const sampleCompanies = [
      {
        companyName: 'Nexa Solutions',
        industry: 'Technology',
        address: 'Skopje, Macedonia',
        taxNumber: '123456789'
      }
    ];
    
    await User.insertMany(sampleUsers);
    await Company.insertMany(sampleCompanies);
    
    await closeDB();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
