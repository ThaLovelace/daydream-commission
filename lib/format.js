function money(n) {
  return (n || 0).toLocaleString('th-TH') + ' ฿';
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function thaiDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)}/${parseInt(m)}/${(parseInt(y) + 543).toString().slice(-2)}`;
}

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function thaiMonthName(ym) {
  const [y, m] = ym.split('-');
  return `${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

function westernDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

module.exports = { money, pad, todayStr, nowTime, thaiDate, thaiMonthName, westernDate, THAI_MONTHS };