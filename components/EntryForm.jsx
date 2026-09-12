'use client';
import { useEffect, useState } from 'react';
import { money, nowTime } from '../lib/format';

export default function EntryForm({ branches, mainServices, addonServices, editingEntry, onSave, onCancelEdit, nextCustomerNo }) {
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [serviceId, setServiceId] = useState(mainServices[0]?.id || '');
  const [addonIds, setAddonIds] = useState(new Set());
  const [customAmount, setCustomAmount] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [startTime, setStartTime] = useState(nowTime());

  useEffect(() => {
    if (editingEntry) {
      setBranchId(editingEntry.branchId);
      setServiceId(editingEntry.serviceId);
      setAddonIds(new Set(editingEntry.addons.map((a) => a.serviceId)));
      setCustomAmount(editingEntry.customAmount ? String(editingEntry.customAmount) : '');
      setCustomLabel(editingEntry.customLabel || '');
      setStartTime(editingEntry.startTime || nowTime());
    } else {
      setBranchId(branches[0]?.id || '');
      setServiceId(mainServices[0]?.id || '');
      setAddonIds(new Set());
      setCustomAmount('');
      setCustomLabel('');
      setStartTime(nowTime());
    }
  }, [editingEntry]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAddon(id) {
    setAddonIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ใช้ category ตรง ๆ แทนเลข sortOrder ที่เดา — กันพังตอนจำนวนแพ็คหลักเปลี่ยน (เช่นตอนนี้เพิ่มเป็น 5 แพ็ค)
  const mainPacks = mainServices.filter((s) => s.category === 'main');
  const otherMain = mainServices.filter((s) => s.category === 'special');

  const mainPrice = mainServices.find((s) => s.id === serviceId)?.price || 0;
  const addonSum = addonServices
    .filter((a) => addonIds.has(a.id))
    .reduce((s, a) => s + a.price, 0);
  const customNum = Number(customAmount) || 0;
  const total = mainPrice + addonSum + customNum;

  function submit() {
    if (!branchId || !serviceId) return;
    onSave({
      branchId,
      serviceId,
      addonIds: Array.from(addonIds),
      customAmount: customNum,
      customLabel: customLabel || null,
      startTime: startTime || null,
    });
    if (!editingEntry) {
      setAddonIds(new Set());
      setCustomAmount('');
      setCustomLabel('');
      setStartTime(nowTime());
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-line p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-primary-dark text-[15px]">
          {editingEntry ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}
        </h2>
        {!editingEntry && (
          <span className="bg-primary-soft text-primary-dark text-xs font-bold px-2.5 py-1 rounded-full">
            รายการที่ {nextCustomerNo} · อัตโนมัติ
          </span>
        )}
      </div>

      {editingEntry && (
        <div className="flex items-center justify-between bg-gold-soft text-gold text-xs font-bold rounded-xl px-3 py-2 mb-3">
          <span>กำลังแก้ไขรายการนี้อยู่</span>
          <button onClick={onCancelEdit} className="underline">ยกเลิก</button>
        </div>
      )}

      {/* main service section */}
      <div className="rounded-xl bg-primary-soft/60 p-3 mb-3">
        <p className="text-[11px] font-bold text-primary-dark uppercase tracking-wide mb-2">รายการหลัก</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-ink-soft font-semibold block mb-1">สาขา</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-lg border border-line px-2.5 py-2.5 text-sm bg-white tap-target"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-soft font-semibold block mb-1">เวลาเริ่ม</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-line px-2.5 py-2.5 text-sm bg-white tap-target"
            />
          </div>
        </div>
        <label className="text-xs text-ink-soft font-semibold block mb-1">บริการหลัก</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full rounded-lg border border-line px-2.5 py-2.5 text-sm bg-white tap-target"
        >
          {mainPacks.length > 0 && (
            <optgroup label="แพ็คหลัก 1-5">
              {mainPacks.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.price}฿</option>
              ))}
            </optgroup>
          )}
          {otherMain.length > 0 && (
            <optgroup label="รายการอื่น ๆ">
              {otherMain.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.price}฿</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* addon section, visually distinct from main */}
      <div className="rounded-xl bg-gold-soft/50 p-3 mb-3">
        <p className="text-[11px] font-bold text-gold uppercase tracking-wide mb-2">รายการเสริม (เลือกได้มากกว่า 1)</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {addonServices.map((a) => {
            const on = addonIds.has(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAddon(a.id)}
                className={`rounded-full px-3.5 py-2 text-[13px] font-semibold border tap-target ${
                  on ? 'bg-gold text-white border-gold' : 'bg-white text-ink-soft border-line'
                }`}
              >
                {a.name} +{a.price}฿
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="อื่นๆ (ชื่อรายการ)"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="rounded-lg border border-line px-2.5 py-2 text-sm bg-white tap-target"
          />
          <input
            type="number"
            placeholder="อื่นๆ (บาท)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="rounded-lg border border-line px-2.5 py-2 text-sm bg-white tap-target"
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between bg-primary-dark text-white rounded-xl px-4 py-3 mb-3">
        <span className="text-xs opacity-80">ค่าคอมรายการนี้</span>
        <span className="text-xl font-extrabold tabular-nums">{money(total)}</span>
      </div>

      <button
        onClick={submit}
        className="w-full rounded-xl bg-primary text-white font-bold py-3.5 tap-target"
      >
        {editingEntry ? 'บันทึกการแก้ไข' : '+ เพิ่มลงบันทึก'}
      </button>
    </div>
  );
}