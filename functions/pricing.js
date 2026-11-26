// Pure pricing maths (no Firebase imports, so it can be tested with plain Node).
const WEEKEND = [0, 6];          // Sunday, Saturday
const num = v => +v || 0;
const DAY = /^\d{4}-\d{2}-\d{2}/;
const addDays = (s, n) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const isWeekend = day => WEEKEND.includes(new Date(day + "T12:00:00Z").getUTCDay());
// price of one hall or room for one calendar day; a blank weekend price falls back to the weekday price
const dayRate = (sp, day) => num(isWeekend(day) ? (sp.rateWeekend || sp.rateWeekday || sp.rate) : (sp.rateWeekday || sp.rate));

// each hall, each calendar day the event touches; finishing before 6am does not add a day
function bookingPrice(spaces, start, end) {
  const a = start.slice(0, 10); let z = end.slice(0, 10);
  if (z > a && end.slice(11) <= "06:00") z = addDays(z, -1);
  let total = 0;
  for (let d = a; d <= z; d = addDays(d, 1)) spaces.forEach(sp => { total += dayRate(sp, d); });
  return total;
}

// One entry per night (all rooms added together). A night belongs to the date it starts on,
// so check-in Saturday, check-out Monday = Saturday night + Sunday night, both weekend.
// At least one night, to match the app's nightsOf(). override > 0 replaces the room rates (per night, all rooms).
function stayNightly(rooms, checkIn, checkOut, override = 0) {
  const a = checkIn.slice(0, 10), b = checkOut.slice(0, 10), out = [];
  let d = a;
  do { out.push(override > 0 ? override : rooms.reduce((t, r) => t + dayRate(r, d), 0)); d = addDays(d, 1); } while (d < b && out.length < 366);
  return out;
}

module.exports = { WEEKEND, num, DAY, addDays, isWeekend, dayRate, bookingPrice, stayNightly };
