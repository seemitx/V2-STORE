// ============================================================
// discord.js — Discord Webhook Notifications
// ============================================================
// วิธีตั้งค่า:
// 1. ไปที่ Discord > ตั้งค่าเซิร์ฟเวอร์ > Integrations > Webhooks > New Webhook
// 2. เลือกห้อง (channel) ที่ต้องการให้แจ้งเตือน แล้วคัดลอก Webhook URL
// 3. นำ URL มาใส่ในช่องด้านล่าง (จะใช้ห้องเดียวกันซ้ำก็ได้ ถ้าไม่อยากแยกหลายบอท)
// 4. ถ้าไม่ต้องการแจ้งเตือนหมวดไหน ให้เว้นว่างไว้ ('') ระบบจะข้ามหมวดนั้นให้อัตโนมัติ
// ============================================================

const DISCORD_WEBHOOKS = {
  // 📦 รับเข้า / เบิกออก / สินค้าใกล้หมด-หมดสต๊อก
  stock:   'https://discord.com/api/webhooks/1536206070622457937/k5-2zxUWOgYL44_x7OIdssspwjbCVZVz4Ckq0oF9Y6xtSbeAMB_9UIpH08u0KX2oH9Z-',
  // 🛒 เพิ่ม / แก้ไข / ลบสินค้า
  product: 'https://discord.com/api/webhooks/1536206143444226130/2kve1soVShkudGiuT5dH8RloOlzVSEySebK0j6NXOFEvut2jgb-cIJzHCB8wfZUEZ2bb',
  // 🔐 การเข้าสู่ระบบ
  system:  'https://discord.com/api/webhooks/1536206216659865715/FULvExG6ZU-DXE1zRECiV_A0mmUZwJk1dsoD9WXEztPbmPhQ4ISjhMG6ajStTiE4bgur',
};

// ชื่อ + อวาตาร์ของ "บอท" ที่จะแสดงในข้อความแต่ละหมวด (ปรับได้ตามใจชอบ)
const DISCORD_BOT_PROFILE = {
  stock:   { username: 'V2 Store • คลังสินค้า',  avatar_url: 'https://cdn-icons-png.flaticon.com/512/2897/2897785.png' },
  product: { username: 'V2 Store • สินค้า',      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png' },
  system:  { username: 'V2 Store • ระบบ',        avatar_url: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png' },
};

const DISCORD_COLOR = {
  green:  0x10B981,
  red:    0xEF4444,
  orange: 0xF59E0B,
  blue:   0x3B82F6,
  gray:   0x64748B,
};

// ============================================================
// Core Sender
// ============================================================
async function sendDiscordNotification(category, embed) {
  const webhookUrl = DISCORD_WEBHOOKS[category];
  if (!webhookUrl) return; // ยังไม่ได้ตั้งค่า webhook หมวดนี้ -> ข้ามเงียบๆ

  const profile = DISCORD_BOT_PROFILE[category] || {};
  const payload = {
    username: profile.username,
    avatar_url: profile.avatar_url,
    embeds: [{
      ...embed,
      timestamp: new Date().toISOString(),
      footer: embed.footer || { text: 'V2 Store • ระบบจัดการคลังสินค้า' },
    }],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // ไม่ให้ error จาก Discord ไปรบกวนการทำงานหลักของระบบ
    console.error('Discord webhook error:', err);
  }
}

function discordCurrentUser() {
  const u = typeof getSession === 'function' ? getSession() : null;
  return u ? `${u.username}${u.role ? ` (${u.role === 'admin' ? 'ผู้ดูแล' : 'พนักงาน'})` : ''}` : 'ไม่ทราบผู้ใช้';
}

// ============================================================
// 📦 หมวดสต๊อก: รับเข้า / เบิกออก / ใกล้หมด-หมดสต๊อก
// ============================================================
async function notifyStockIn({ productName, sku, quantity, unit, supplier, date, note, newQuantity }) {
  await sendDiscordNotification('stock', {
    title: '📥 รับสินค้าเข้าคลัง',
    color: DISCORD_COLOR.green,
    fields: [
      { name: 'สินค้า', value: `${productName}${sku ? ` \`${sku}\`` : ''}`, inline: false },
      { name: 'จำนวนที่รับเข้า', value: `+${formatNumber(quantity)} ${unit || 'ชิ้น'}`, inline: true },
      { name: 'คงเหลือปัจจุบัน', value: newQuantity != null ? `${formatNumber(newQuantity)} ${unit || 'ชิ้น'}` : '-', inline: true },
      { name: 'ผู้จัดจำหน่าย', value: supplier || '-', inline: true },
      { name: 'วันที่', value: date ? formatDate(date) : '-', inline: true },
      ...(note ? [{ name: 'หมายเหตุ', value: note, inline: false }] : []),
      { name: 'ทำรายการโดย', value: discordCurrentUser(), inline: false },
    ],
  });
}

async function notifyStockOut({ productName, sku, quantity, unit, receiver, date, note, newQuantity }) {
  await sendDiscordNotification('stock', {
    title: '📤 เบิกสินค้าออกจากคลัง',
    color: DISCORD_COLOR.orange,
    fields: [
      { name: 'สินค้า', value: `${productName}${sku ? ` \`${sku}\`` : ''}`, inline: false },
      { name: 'จำนวนที่เบิกออก', value: `-${formatNumber(quantity)} ${unit || 'ชิ้น'}`, inline: true },
      { name: 'คงเหลือปัจจุบัน', value: newQuantity != null ? `${formatNumber(newQuantity)} ${unit || 'ชิ้น'}` : '-', inline: true },
      { name: 'ผู้รับสินค้า', value: receiver || '-', inline: true },
      { name: 'วันที่', value: date ? formatDate(date) : '-', inline: true },
      ...(note ? [{ name: 'หมายเหตุ', value: note, inline: false }] : []),
      { name: 'ทำรายการโดย', value: discordCurrentUser(), inline: false },
    ],
  });
}

async function notifyLowStock({ productName, sku, quantity, unit, minStock }) {
  const isEmpty = parseInt(quantity) === 0;
  await sendDiscordNotification('stock', {
    title: isEmpty ? '🚨 สินค้าหมดสต๊อก!' : '⚠️ สินค้าใกล้หมด',
    description: `**${productName}**${sku ? ` \`${sku}\`` : ''} ${isEmpty ? 'หมดสต๊อกแล้ว กรุณาสั่งซื้อเพิ่มด่วน' : 'เหลือน้อยกว่าจุดสั่งซื้อ ควรเติมสต๊อกเร็วๆ นี้'}`,
    color: isEmpty ? DISCORD_COLOR.red : DISCORD_COLOR.orange,
    fields: [
      { name: 'คงเหลือ', value: `${formatNumber(quantity)} ${unit || 'ชิ้น'}`, inline: true },
      { name: 'จุดสั่งซื้อขั้นต่ำ', value: `${formatNumber(minStock)} ${unit || 'ชิ้น'}`, inline: true },
    ],
  });
}

// ============================================================
// 🛒 หมวดสินค้า: เพิ่ม / แก้ไข / ลบ
// ============================================================
async function notifyProductAdd({ productName, sku, category, unit, quantity, costPrice, sellPrice }) {
  await sendDiscordNotification('product', {
    title: '🆕 เพิ่มสินค้าใหม่',
    color: DISCORD_COLOR.blue,
    fields: [
      { name: 'ชื่อสินค้า', value: productName, inline: false },
      { name: 'SKU', value: sku || '-', inline: true },
      { name: 'หมวดหมู่', value: category || '-', inline: true },
      { name: 'จำนวนเริ่มต้น', value: `${formatNumber(quantity)} ${unit || 'ชิ้น'}`, inline: true },
      { name: 'ราคาทุน', value: formatCurrency(costPrice), inline: true },
      { name: 'ราคาขาย', value: formatCurrency(sellPrice), inline: true },
      { name: 'เพิ่มโดย', value: discordCurrentUser(), inline: false },
    ],
  });
}

async function notifyProductUpdate({ productName, sku }) {
  await sendDiscordNotification('product', {
    title: '✏️ แก้ไขข้อมูลสินค้า',
    color: DISCORD_COLOR.blue,
    description: `**${productName}**${sku ? ` \`${sku}\`` : ''} ถูกแก้ไขข้อมูล`,
    fields: [
      { name: 'แก้ไขโดย', value: discordCurrentUser(), inline: false },
    ],
  });
}

async function notifyProductDelete({ productName, id }) {
  await sendDiscordNotification('product', {
    title: '🗑️ ลบสินค้าออกจากระบบ',
    color: DISCORD_COLOR.red,
    fields: [
      { name: 'สินค้าที่ถูกลบ', value: productName || id || '-', inline: false },
      { name: 'ลบโดย', value: discordCurrentUser(), inline: false },
    ],
  });
}

// ============================================================
// 🔐 หมวดระบบ: การเข้าสู่ระบบ
// ============================================================
async function notifyLoginSuccess({ username, role }) {
  await sendDiscordNotification('system', {
    title: '🔓 เข้าสู่ระบบสำเร็จ',
    color: DISCORD_COLOR.green,
    fields: [
      { name: 'ผู้ใช้', value: username, inline: true },
      { name: 'สิทธิ์', value: role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน', inline: true },
    ],
  });
}

async function notifyLoginFailed({ username }) {
  await sendDiscordNotification('system', {
    title: '🚫 พยายามเข้าสู่ระบบไม่สำเร็จ',
    color: DISCORD_COLOR.red,
    description: `มีความพยายามเข้าสู่ระบบด้วยชื่อผู้ใช้ **${username || 'ไม่ทราบ'}** แต่ล้มเหลว`,
  });
}
