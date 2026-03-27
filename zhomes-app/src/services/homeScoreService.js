/**
 * Home Score Service — Personalized Property Matching
 * 100% custom algorithm, $0/month — no external API
 * Calculates a 0-100 match score based on user preferences
 */

export const HomeScoreService = {
  /**
   * Calculate personalized Home Score for a property
   * @param {object} property - Property data (price, beds, baths, sqft, lat, lng)
   * @param {object} preferences - User preferences
   * @param {object} extras - Optional: walkScore, schoolRating, swipeHistory
   * @returns {{ score: number, breakdown: object }}
   */
  calculateScore(property, preferences, extras = {}) {
    const weights = {
      price: 25,
      bedrooms: 15,
      bathrooms: 10,
      sqft: 15,
      location: 15,
      walkScore: 10,
      schools: 10
    };

    const scores = {};

    // 1. Price match (25 points)
    if (preferences.maxPrice && preferences.minPrice) {
      const price = property.price;
      if (price >= preferences.minPrice && price <= preferences.maxPrice) {
        scores.price = 25;
      } else if (price < preferences.minPrice) {
        scores.price = 20; // Under budget is still good
      } else {
        const overBy = (price - preferences.maxPrice) / preferences.maxPrice;
        scores.price = Math.max(0, 25 - (overBy * 100));
      }
    } else {
      scores.price = 15; // Neutral if no preference
    }

    // 2. Bedrooms match (15 points)
    if (preferences.minBeds) {
      const diff = Math.abs(property.beds - preferences.minBeds);
      scores.bedrooms = diff === 0 ? 15 : diff === 1 ? 10 : 5;
    } else {
      scores.bedrooms = 10;
    }

    // 3. Bathrooms match (10 points)
    if (preferences.minBaths) {
      const diff = Math.abs(property.baths - preferences.minBaths);
      scores.bathrooms = diff === 0 ? 10 : diff === 1 ? 7 : 3;
    } else {
      scores.bathrooms = 7;
    }

    // 4. Size match (15 points)
    if (preferences.minSqft) {
      const ratio = property.sqft / preferences.minSqft;
      if (ratio >= 0.9 && ratio <= 1.3) scores.sqft = 15;
      else if (ratio >= 0.7) scores.sqft = 10;
      else scores.sqft = 5;
    } else {
      scores.sqft = 10;
    }

    // 5. Location proximity (15 points)
    if (preferences.targetLat && preferences.targetLng && property.lat && property.lng) {
      const distance = this.haversineDistance(
        property.lat, property.lng,
        preferences.targetLat, preferences.targetLng
      );
      const maxDistanceMiles = preferences.maxDistance || 15;
      if (distance <= maxDistanceMiles * 0.5) scores.location = 15;
      else if (distance <= maxDistanceMiles) scores.location = 10;
      else scores.location = Math.max(0, 15 - (distance / maxDistanceMiles) * 10);
    } else {
      scores.location = 8;
    }

    // 6. WalkScore bonus (10 points)
    if (extras.walkScore) {
      scores.walkScore = (extras.walkScore / 100) * 10;
    } else {
      scores.walkScore = 5; // Neutral
    }

    // 7. School rating bonus (10 points)
    if (extras.schoolRating) {
      scores.schools = extras.schoolRating; // Already 0-10 scale
    } else {
      scores.schools = 5; // Neutral
    }

    // Sum all scores
    const totalScore = Math.round(
      Object.values(scores).reduce((sum, s) => sum + s, 0)
    );

    return {
      score: Math.min(100, totalScore),
      breakdown: scores,
      label: this.getScoreLabel(totalScore),
      emoji: this.getScoreEmoji(totalScore)
    };
  },

  /**
   * Haversine formula for distance between two coordinates (in miles)
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  getScoreLabel(score) {
    if (score >= 90) return 'Match Perfecto';
    if (score >= 75) return 'Excelente Match';
    if (score >= 60) return 'Buen Match';
    if (score >= 40) return 'Match Moderado';
    return 'Match Bajo';
  },

  getScoreEmoji(score) {
    if (score >= 90) return '🎯';
    if (score >= 75) return '🔥';
    if (score >= 60) return '👍';
    if (score >= 40) return '🤔';
    return '👎';
  },

  getScoreColor(score) {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#34D399';
    if (score >= 60) return '#FBBF24';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  }
};
