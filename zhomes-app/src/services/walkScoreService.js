/**
 * WalkScore API Service
 * Free tier: 5,000 calls/day
 * Docs: https://www.walkscore.com/professional/api.php
 */

const WALKSCORE_API_KEY = import.meta.env.VITE_WALKSCORE_API_KEY || '';

export const WalkScoreService = {
  /**
   * Get Walk Score, Transit Score, and Bike Score for an address
   * @param {string} address - Full street address
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<{walkscore: number, transit: {score: number}, bike: {score: number}, description: string}>}
   */
  async getScore(address, lat, lon) {
    if (!WALKSCORE_API_KEY) {
      console.warn('WalkScore API key not configured. Set VITE_WALKSCORE_API_KEY in .env');
      return null;
    }

    try {
      // WalkScore API requires server-side proxy due to CORS
      // We use our Vite dev server proxy or Supabase Edge Function
      const params = new URLSearchParams({
        format: 'json',
        address: address,
        lat: lat,
        lon: lon,
        transit: 1,
        bike: 1,
        wsapikey: WALKSCORE_API_KEY
      });

      const response = await fetch(`/api/walkscore?${params.toString()}`);
      
      if (!response.ok) throw new Error('WalkScore API error');
      
      const data = await response.json();
      
      return {
        walkscore: data.walkscore || 0,
        description: data.description || '',
        transit: data.transit || { score: 0, description: '', summary: '' },
        bike: data.bike || { score: 0, description: '' },
        logo: data.ws_link || '',
        snapped_lat: data.snapped_lat,
        snapped_lon: data.snapped_lon
      };
    } catch (error) {
      console.error('WalkScore fetch error:', error);
      return null;
    }
  },

  /**
   * Get label color based on score value
   */
  getScoreColor(score) {
    if (score >= 90) return '#00B74A';
    if (score >= 70) return '#8BC34A';
    if (score >= 50) return '#FFC107';
    if (score >= 25) return '#FF9800';
    return '#F44336';
  },

  /**
   * Get label text based on score value
   */
  getScoreLabel(score) {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return 'Very Walkable';
    if (score >= 50) return 'Somewhat Walkable';
    if (score >= 25) return 'Car-Dependent';
    return 'Almost All Errands Require a Car';
  }
};
