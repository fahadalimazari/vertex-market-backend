/**
 * Calculate dynamic badges for a store based on its real metrics.
 * Prioritizes badges and returns up to 2.
 * 
 * @param {Object} store - The seller document
 * @param {Number} activeProducts - Total active products
 * @param {Number} completedOrders - Total completed orders
 * @returns {Array} List of badge objects { type, label }
 */
export const calculateStoreBadges = (store, activeProducts = 0, completedOrders = 0) => {
  if (store.status !== 'Approved' || store.status === 'Suspended') {
    return [];
  }

  const followers = store.followers || 0;
  const rating = store.storeRating || 0;
  
  // Calculate store age in days
  const now = new Date();
  const createdAt = store.createdAt ? new Date(store.createdAt) : now;
  const storeAgeDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

  const earnedBadges = [];

  // Priority 1: Main Follower/Performance Badges (Only 1 will be added from this group)
  if (followers >= 10000 && rating >= 4.5 && activeProducts >= 20 && completedOrders >= 100) {
    earnedBadges.push({ type: 'ELITE_STORE', label: 'Elite Store', priority: 1 });
  } else if (followers >= 5000 && rating >= 4.3 && activeProducts >= 10 && completedOrders >= 50) {
    earnedBadges.push({ type: 'TOP_STORE', label: 'Top Store', priority: 2 });
  } else if (followers >= 1000 && rating >= 4.0) {
    earnedBadges.push({ type: 'TRUSTED_STORE', label: 'Trusted Store', priority: 3 });
  } else if (followers >= 500) {
    earnedBadges.push({ type: 'POPULAR_STORE', label: 'Popular Store', priority: 4 });
  } else if (followers >= 100) {
    earnedBadges.push({ type: 'RISING_STORE', label: 'Rising Store', priority: 5 });
  }

  // Priority 2: Achievement Badges
  if (rating >= 4.7) {
    earnedBadges.push({ type: 'TOP_RATED', label: 'Top Rated', priority: 6 });
  }
  
  if (completedOrders >= 100) {
    earnedBadges.push({ type: 'BEST_SELLER', label: 'Best Seller', priority: 7 });
  }

  if (store.isVerified) {
    earnedBadges.push({ type: 'VERIFIED_SELLER', label: 'Verified Seller', priority: 8 });
  }

  if (storeAgeDays <= 30) {
    earnedBadges.push({ type: 'NEW_STORE', label: 'New Store', priority: 9 });
  }

  // Sort by priority (lower number = higher priority)
  earnedBadges.sort((a, b) => a.priority - b.priority);

  // Return max 2 badges, removing the priority key
  return earnedBadges.slice(0, 2).map(b => ({ type: b.type, label: b.label }));
};
