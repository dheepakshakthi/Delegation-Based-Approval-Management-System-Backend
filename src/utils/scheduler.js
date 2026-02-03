const Delegation = require('../models/Delegation');

// Function to check and expire delegations
const checkExpiredDelegations = async () => {
  try {
    const now = new Date();
    
    const result = await Delegation.updateMany(
      {
        isActive: true,
        endDate: { $lt: now },
        autoExpired: false
      },
      {
        $set: {
          isActive: false,
          autoExpired: true
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⏰ Auto-expired ${result.modifiedCount} delegations`);
    }
  } catch (error) {
    console.error('❌ Error checking expired delegations:', error.message);
  }
};

// Run every hour
const startScheduler = () => {
  // Check immediately on startup
  checkExpiredDelegations();
  
  // Then check every hour
  setInterval(checkExpiredDelegations, 60 * 60 * 1000); // 1 hour
  
  console.log('✅ Delegation expiry scheduler started');
};

module.exports = { checkExpiredDelegations, startScheduler };
