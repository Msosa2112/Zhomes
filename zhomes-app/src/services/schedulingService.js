/**
 * Scheduling Service — DIY Calendar/Booking System
 * Uses Supabase tables: realtor_availability, bookings
 * $0/month — no external API needed
 */

import { supabase } from '../lib/supabaseClient';

export const SchedulingService = {
  /**
   * Get a realtor's available time slots for a given date
   * @param {string} realtorId
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Array<{time: string, available: boolean}>>}
   */
  async getAvailableSlots(realtorId, date) {
    const dayOfWeek = new Date(date).getDay(); // 0=Sun, 6=Sat

    // Get realtor's configured availability for that day
    const { data: availability } = await supabase
      .from('realtor_availability')
      .select('*')
      .eq('realtor_id', realtorId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!availability) return [];

    // Get existing bookings for that date
    const { data: bookings } = await supabase
      .from('bookings')
      .select('time_slot')
      .eq('realtor_id', realtorId)
      .eq('booking_date', date)
      .neq('status', 'cancelled');

    const bookedSlots = new Set((bookings || []).map(b => b.time_slot));

    // Generate slots between start/end time (1-hour intervals)
    const slots = [];
    const startHour = parseInt(availability.start_time.split(':')[0]);
    const endHour = parseInt(availability.end_time.split(':')[0]);

    for (let h = startHour; h < endHour; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      slots.push({
        time: timeStr,
        display: formatTimeDisplay(h),
        available: !bookedSlots.has(timeStr)
      });
    }

    return slots;
  },

  /**
   * Create a booking
   */
  async createBooking({ realtorId, propertyId, clientName, clientPhone, clientEmail, date, timeSlot, notes }) {
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        realtor_id: realtorId,
        property_id: propertyId,
        client_user_id: session?.user?.id || null,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        booking_date: date,
        time_slot: timeSlot,
        notes: notes || '',
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    
    if (error) throw error;
  },

  /**
   * Get all bookings for a realtor
   */
  async getRealtorBookings(realtorId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('realtor_id', realtorId)
      .order('booking_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Set realtor weekly availability
   */
  async setAvailability(realtorId, dayOfWeek, startTime, endTime) {
    const { error } = await supabase
      .from('realtor_availability')
      .upsert({
        realtor_id: realtorId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
      }, { onConflict: 'realtor_id,day_of_week' });

    if (error) throw error;
  }
};

function formatTimeDisplay(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${suffix}`;
}
