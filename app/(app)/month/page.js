'use client';
import { useEffect, useMemo, useState } from 'react';
import { Copy, Printer, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import EntryCard from '../../../components/EntryCard';
import { money, thaiDate, thaiMonthName, westernDate, todayStr, THAI_MONTHS } from '../../../lib/format';
const MONTH_BONUS_THRESHOLD = 8000;
const MONTH_BONUS_RATE = 0.15;

function currentYm() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthPage() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [ym, setYm] = useState(currentYm());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopAmount, setShopAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedDates, setExpandedDates] = useState(new Set());

  useEffect(() => {
    // เปิดหน้าเดือนใหม่ทีไร พับรายละเอียดรายวันไว้ก่อนเสมอ กันเลื่อนจอยาวตอนเดือนมีรายการเยอะ
    setExpandedDates(new Set());
  }, [ym]);

  function toggleDate(date) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  useEffect(() => {
    fetch('/api/session').then((r) => r.json()).then((d) => {
      setUserId(d.user?.id || null);
      setUserName(d.user?.name || '');
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/entries?userId=${userId}&month=${ym}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .finally(() => setLoading(false));
  }, [userId, ym]);

  const report = useMemo(() => {
    const byDate = {};
    entries.forEach((e) => { (byDate[e.entryDate] ||= []).push(e); });
    const byBranch = {};
    entries.forEach((e) => { byBranch[e.branch.name] = (byBranch[e.branch.name] || 0) + e.commission; });
    const itemsTotal = entries.reduce((s, e) => s + e.commission, 0);
    const bonusEligible = itemsTotal >= MONTH_BONUS_THRESHOLD;
    const bonusAmount = bonusEligible ? Math.round(itemsTotal * MONTH_BONUS_RATE) : 0;
    const grandTotal = itemsTotal + bonusAmount;
    return { byDate, byBranch, itemsTotal, bonusEligible, bonusAmount, grandTotal };
  }, [entries]);

  // แตกทุกรายการ (บริการหลัก + รายการเสริมแต่ละอย่าง + อื่นๆ) ให้เป็นแถวเดี่ยว ๆ
  // เรียงตามวันที่ ให้ตารางที่พิมพ์ออกมาหน้าตาเหมือนสลิปเดิมที่ร้านคุ้นเคย
  const printRows = useMemo(() => {
    const rows = [];
    Object.keys(report.byDate).sort().forEach((date) => {
      report.byDate[date].forEach((e) => {
        rows.push({ date, name: e.service.name, branch: e.branch.name, amount: e.service.price });
        e.addons.forEach((a) => {
          rows.push({ date, name: `** ${a.service.name}`, branch: e.branch.name, amount: a.service.price });
        });
        if (e.customAmount > 0) {
          rows.push({ date, name: e.customLabel || 'อื่นๆ', branch: e.branch.name, amount: e.customAmount });
        }
      });
    });
    return rows;
  }, [report]);

  const exportText = useMemo(() => {
    let out = `DAYDREAM MASSAGE & SPA\nสรุปค่าคอม เดือน ${thaiMonthName(ym)}\nช่าง: ${userName}\n${'—'.repeat(28)}\n`;
    Object.keys(report.byDate).sort().forEach((date) => {
      out += `${thaiDate(date)}\n`;
      report.byDate[date].forEach((e, i) => {
        const addonTxt = e.addons.map((a) => ` + ${a.service.name}`).join('');
        const customTxt = e.customAmount ? ` + ${e.customLabel || 'อื่นๆ'} (${e.customAmount}฿)` : '';
        out += `  ${i + 1}. ${e.service.name}${addonTxt}${customTxt} (${e.branch.name}) — ${e.commission}฿\n`;
      });
    });
    out += `${'—'.repeat(28)}\n`;
    Object.entries(report.byBranch).forEach(([b, amt]) => { out += `${b}: ${amt}฿\n`; });
    out += `รวมค่าคอม (ตามรายการ): ${report.itemsTotal}฿\n`;
    if (report.bonusEligible) out += `โบนัสยอดเดือน 15%: +${report.bonusAmount}฿\n`;
    out += `รวมทั้งหมด: ${report.grandTotal}฿\n`;
    return out;
  }, [report, ym, userName]);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert('คัดลอกไม่สำเร็จ ลองแตะเลือกข้อความในกล่องด้านล่างเอง');
    }
  }

  const branchEntries = Object.entries(report.byBranch);
  const progressPct = Math.min(100, Math.round((report.itemsTotal / MONTH_BONUS_THRESHOLD) * 100));
  const shopDiff = shopAmount === '' ? null : report.itemsTotal - Number(shopAmount);

  if (!userId) return <p className="text-center text-ink-faint py-10 text-sm">กำลังโหลด...</p>;

  return (
    <div className="space-y-4">
      <div className="no-print rounded-2xl bg-white border border-line p-3 shadow-card">
        <label className="text-xs font-semibold text-ink-soft block mb-1">เลือกเดือน</label>
        <input
          type="month"
          value={ym}
          onChange={(e) => setYm(e.target.value)}
          className="w-full rounded-xl border border-line px-3 py-2.5 text-sm tap-target"
        />
      </div>

      {loading ? (
        <p className="text-center text-ink-faint py-10 text-sm">กำลังโหลด...</p>
      ) : entries.length === 0 ? (
        <div className="text-center text-ink-faint py-10 text-sm bg-white rounded-2xl border border-dashed border-line">
          ยังไม่มีรายการในเดือนนี้
        </div>
      ) : (
        <>
          <div className="no-print space-y-4">
            <div className="flex items-baseline justify-between px-0.5">
              <h2 className="font-bold text-primary-dark text-base">รายงานค่าคอม เดือน {thaiMonthName(ym)}</h2>
              <span className="text-xs text-ink-faint">{entries.length} รายการ</span>
            </div>

            <div className="rounded-2xl bg-primary-soft p-3.5 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink-soft">จำนวนรายการทั้งเดือน</p>
              <p className="text-xl font-extrabold text-primary-dark tabular-nums">{entries.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {branchEntries.map(([name, amt], i) => (
                <div key={name} className={`rounded-2xl p-3.5 ${i === 0 ? 'bg-teal-soft' : 'bg-amber-soft'}`}>
                  <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${i === 0 ? 'text-teal' : 'text-amber'}`}>
                    <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-teal' : 'bg-amber'}`} />
                    {name}
                  </p>
                  <p className={`text-xl font-extrabold tabular-nums ${i === 0 ? 'text-teal' : 'text-amber'}`}>{money(amt)}</p>
                </div>
              ))}
            </div>

            {report.bonusEligible ? (
              <div className="rounded-2xl bg-gold-soft text-gold font-bold text-sm px-4 py-3 text-center">
                🎉 ถึงเกณฑ์ 8,000 บาทแล้ว — ได้โบนัสเพิ่ม {money(report.bonusAmount)} (15%)
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-line p-3.5">
                <div className="h-2.5 rounded-full bg-primary-soft overflow-hidden">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-ink-soft mt-2">
                  <span>{money(report.itemsTotal)}</span>
                  <span>อีก {money(MONTH_BONUS_THRESHOLD - report.itemsTotal)} ถึงโบนัส 15%</span>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80 font-semibold">ยอดค่าคอมรวมเดือนนี้</p>
                <p className="text-[11px] opacity-70 mt-0.5">
                  {report.bonusEligible
                    ? `จากรายการ ${money(report.itemsTotal)} + โบนัส 15% ${money(report.bonusAmount)}`
                    : `รวมจากรายการทั้งหมด ${entries.length} รายการ`}
                </p>
              </div>
              <p className="text-2xl font-extrabold tabular-nums">{money(report.grandTotal)}</p>
            </div>

            <div>
              <div className="flex items-center justify-between px-0.5 mb-1.5">
                <p className="text-xs font-bold text-ink-soft">รายละเอียดรายวัน</p>
                <button
                  onClick={() => setExpandedDates((prev) =>
                    prev.size === Object.keys(report.byDate).length ? new Set() : new Set(Object.keys(report.byDate))
                  )}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary tap-target px-1"
                >
                  {expandedDates.size === Object.keys(report.byDate).length
                    ? <><ChevronsDownUp size={13} /> ย่อทั้งหมด</>
                    : <><ChevronsUpDown size={13} /> ขยายทั้งหมด</>}
                </button>
              </div>
              <div className="space-y-2">
                {Object.keys(report.byDate).sort().map((date) => {
                  const dayEntries = report.byDate[date];
                  const dayTotal = dayEntries.reduce((s, e) => s + e.commission, 0);
                  const isOpen = expandedDates.has(date);
                  return (
                    <div key={date} className="rounded-2xl bg-white border border-line overflow-hidden">
                      <button
                        onClick={() => toggleDate(date)}
                        className="w-full flex items-center justify-between px-3.5 py-3 tap-target"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown size={16} className="text-ink-faint" /> : <ChevronRight size={16} className="text-ink-faint" />}
                          <span className="text-sm font-bold text-ink">{thaiDate(date)}</span>
                          <span className="text-[11px] text-ink-faint">{dayEntries.length} รายการ</span>
                        </div>
                        <span className="text-sm font-extrabold text-primary-dark tabular-nums">{money(dayTotal)}</span>
                      </button>
                      {isOpen && (
                        <div className="space-y-2 px-3 pb-3 pt-0.5 bg-[#fafbfd]">
                          {dayEntries.map((e) => (
                            <EntryCard key={e.id} entry={e} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== รายงานฉบับพิมพ์ (A4) — โชว์เฉพาะตอนพิมพ์/เซฟเป็น PDF เท่านั้น ===== */}
          <div className="hidden print:block print-report">
            <div className="print-keep rounded-lg overflow-hidden border border-line">
              <div className="bg-primary-dark text-white px-5 py-4">
                <p className="text-[11px] tracking-widest opacity-80 font-semibold">DAYDREAM MASSAGE & SPA</p>
                <p className="text-xl font-extrabold mt-0.5">สลิปค่าคอมพนักงาน</p>
                <p className="text-xs opacity-80 mt-0.5">เดือน{thaiMonthName(ym)}</p>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 bg-primary-soft text-[12px]">
                <span className="font-semibold text-primary-dark">ช่าง: {userName}</span>
                <span className="text-ink-soft">สาขา: {Object.keys(report.byBranch).join(' / ')}</span>
              </div>
            </div>

            <div className="print-keep grid mt-3 mb-3" style={{ gridTemplateColumns: `repeat(${2 + branchEntries.length}, 1fr)`, gap: '8px' }}>
              <div className="rounded-lg bg-primary-soft text-center py-2.5 px-1">
                <p className="text-[10px] text-ink-soft font-semibold">จำนวนรายการ</p>
                <p className="text-lg font-extrabold text-primary-dark tabular-nums">{entries.length}</p>
              </div>
              {branchEntries.map(([name, amt]) => (
                <div key={name} className="rounded-lg bg-teal-soft text-center py-2.5 px-1">
                  <p className="text-[10px] text-teal font-semibold truncate">{name}</p>
                  <p className="text-lg font-extrabold text-teal tabular-nums">{amt.toLocaleString('th-TH')}</p>
                </div>
              ))}
              <div className="rounded-lg bg-primary text-white text-center py-2.5 px-1">
                <p className="text-[10px] opacity-85 font-semibold">รวมค่าคอม</p>
                <p className="text-lg font-extrabold tabular-nums">{report.grandTotal.toLocaleString('th-TH')}</p>
              </div>
            </div>

            <div className={`print-keep rounded-lg text-center text-[12px] font-semibold py-2 mb-3 ${
              report.bonusEligible ? 'bg-gold-soft text-gold' : 'bg-[#fdf6e3] text-ink-soft'
            }`}>
              {report.bonusEligible
                ? `ถึงเกณฑ์ 8,000 บาทแล้ว — ได้โบนัสเพิ่ม ${report.bonusAmount.toLocaleString('th-TH')} บาท (15%)`
                : `ค่าคอมรวมยังไม่ถึง 8,000 บาท (อีก ${(MONTH_BONUS_THRESHOLD - report.itemsTotal).toLocaleString('th-TH')} บาท ถึงเกณฑ์รับโบนัสเพิ่ม 15%)`}
            </div>

            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-primary-dark text-white">
                  <th className="text-left font-semibold py-2 px-2.5 border border-primary-dark" style={{ width: '18%' }}>วันที่</th>
                  <th className="text-left font-semibold py-2 px-2.5 border border-primary-dark">โปรแกรม</th>
                  <th className="text-left font-semibold py-2 px-2.5 border border-primary-dark" style={{ width: '20%' }}>สาขา</th>
                  <th className="text-right font-semibold py-2 px-2.5 border border-primary-dark" style={{ width: '18%' }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {printRows.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f3f5fa]'}>
                    <td className="py-1.5 px-2.5 border border-line">{westernDate(r.date)}</td>
                    <td className="py-1.5 px-2.5 border border-line">{r.name}</td>
                    <td className="py-1.5 px-2.5 border border-line">{r.branch}</td>
                    <td className="py-1.5 px-2.5 border border-line text-right tabular-nums">{r.amount.toLocaleString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right font-bold py-2 px-2.5 border border-line bg-primary-soft">รวมค่าคอม (ตามรายการ)</td>
                  <td className="text-right font-bold py-2 px-2.5 border border-line bg-primary-soft tabular-nums">{report.itemsTotal.toLocaleString('th-TH')}</td>
                </tr>
                {report.bonusEligible && (
                  <tr>
                    <td colSpan={3} className="text-right font-bold py-2 px-2.5 border border-line bg-gold-soft text-gold">โบนัส 15%</td>
                    <td className="text-right font-bold py-2 px-2.5 border border-line bg-gold-soft text-gold tabular-nums">+{report.bonusAmount.toLocaleString('th-TH')}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="text-right font-extrabold py-2 px-2.5 border border-line bg-primary text-white">รวมทั้งหมด</td>
                  <td className="text-right font-extrabold py-2 px-2.5 border border-line bg-primary text-white tabular-nums">{report.grandTotal.toLocaleString('th-TH')}</td>
                </tr>
              </tfoot>
            </table>

            <p className="text-[10px] text-ink-faint text-right mt-2">
              พิมพ์จากระบบ · {westernDate(todayStr())}
            </p>
          </div>

          <div className="no-print rounded-2xl bg-white border border-line p-4 shadow-card">
            <h3 className="font-bold text-primary-dark text-sm mb-2.5">เทียบยอดกับสลิปร้าน</h3>
            <label className="text-xs font-semibold text-ink-soft block mb-1">ยอดที่ร้านแจ้ง (บาท)</label>
            <input
              type="number"
              value={shopAmount}
              onChange={(e) => setShopAmount(e.target.value)}
              placeholder="เช่น 6940"
              className="w-full rounded-xl border border-line px-3 py-2.5 text-sm tap-target"
            />
            {shopDiff !== null && (
              <div className={`mt-3 rounded-xl text-center text-sm font-bold py-2.5 ${
                shopDiff === 0 ? 'bg-teal-soft text-teal' : 'bg-red-50 text-red-600'
              }`}>
                {shopDiff === 0
                  ? `ยอดตรงกัน ✓ (${money(report.itemsTotal)})`
                  : `ยอดไม่ตรง — ของช่าง ${money(report.itemsTotal)} ร้านแจ้ง ${money(Number(shopAmount))} ต่าง ${money(Math.abs(shopDiff))}`}
              </div>
            )}
          </div>

          <div className="no-print rounded-2xl bg-white border border-line p-4 shadow-card">
            <h3 className="font-bold text-primary-dark text-sm mb-3">ส่งออกรายงาน</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={copyReport}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line py-3 text-sm font-semibold tap-target"
              >
                <Copy size={16} /> {copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line py-3 text-sm font-semibold tap-target"
              >
                <Printer size={16} /> พิมพ์ / PDF
              </button>
            </div>
            <textarea
              readOnly
              value={exportText}
              className="w-full h-40 rounded-xl border border-line p-3 text-xs font-mono bg-[#fbfbfd]"
            />
          </div>
        </>
      )}
    </div>
  );
}