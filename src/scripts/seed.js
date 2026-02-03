require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../models/User');
const ApprovalRequest = require('../models/ApprovalRequest');
const Delegation = require('../models/Delegation');

// Configure DNS for Windows
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@dbams.com',
    password: 'admin123',
    role: 'Admin',
    department: 'IT',
    position: 'System Administrator'
  },
  {
    name: 'John Approver',
    email: 'john.approver@dbams.com',
    password: 'password123',
    role: 'Approver',
    department: 'Management',
    position: 'Department Manager'
  },
  {
    name: 'Sarah Approver',
    email: 'sarah.approver@dbams.com',
    password: 'password123',
    role: 'Approver',
    department: 'HR',
    position: 'HR Manager'
  },
  {
    name: 'Mike Requester',
    email: 'mike.requester@dbams.com',
    password: 'password123',
    role: 'Requester',
    department: 'Sales',
    position: 'Sales Executive'
  },
  {
    name: 'Emma Requester',
    email: 'emma.requester@dbams.com',
    password: 'password123',
    role: 'Requester',
    department: 'Marketing',
    position: 'Marketing Coordinator'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await ApprovalRequest.deleteMany({});
    await Delegation.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get specific users for sample data
    const admin = createdUsers[0];
    const approver1 = createdUsers[1];
    const approver2 = createdUsers[2];
    const requester1 = createdUsers[3];
    const requester2 = createdUsers[4];

    // Create sample approval requests
    console.log('📝 Creating sample approval requests...');
    const requests = [
      {
        title: 'Budget Approval for Q1 Marketing Campaign',
        description: 'Requesting approval for $50,000 budget allocation for Q1 2026 marketing campaign including social media ads and content creation.',
        requestType: 'Budget',
        requester: requester1._id,
        approver: approver1._id,
        priority: 'High',
        amount: 50000,
        status: 'Pending'
      },
      {
        title: 'Annual Leave Request - Feb 10-14',
        description: 'Requesting 5 days of annual leave for personal travel.',
        requestType: 'Leave',
        requester: requester2._id,
        approver: approver2._id,
        priority: 'Medium',
        status: 'Pending'
      },
      {
        title: 'Purchase Order - New Office Equipment',
        description: 'Requesting approval to purchase 10 new laptops and accessories for the sales team.',
        requestType: 'Purchase',
        requester: requester1._id,
        approver: approver1._id,
        priority: 'Urgent',
        amount: 25000,
        status: 'Approved',
        actualApprover: approver1._id,
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        title: 'New Project Proposal - Customer Portal',
        description: 'Proposal for developing a new customer self-service portal. Estimated timeline: 6 months, Budget: $150,000',
        requestType: 'Project',
        requester: requester2._id,
        approver: approver1._id,
        priority: 'High',
        amount: 150000,
        status: 'Pending'
      }
    ];

    const createdRequests = await ApprovalRequest.create(requests);
    console.log(`✅ Created ${createdRequests.length} approval requests`);

    // Create sample delegation
    console.log('🔄 Creating sample delegation...');
    const delegations = [
      {
        delegator: approver1._id,
        delegate: approver2._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        reason: 'On vacation - Feb 3-10',
        isActive: true
      }
    ];

    const createdDelegations = await Delegation.create(delegations);
    console.log(`✅ Created ${createdDelegations.length} delegations`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@dbams.com');
    console.log('  Password: admin123');
    console.log('\nApprover 1:');
    console.log('  Email: john.approver@dbams.com');
    console.log('  Password: password123');
    console.log('\nApprover 2:');
    console.log('  Email: sarah.approver@dbams.com');
    console.log('  Password: password123');
    console.log('\nRequester 1:');
    console.log('  Email: mike.requester@dbams.com');
    console.log('  Password: password123');
    console.log('\nRequester 2:');
    console.log('  Email: emma.requester@dbams.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
