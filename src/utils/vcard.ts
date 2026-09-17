import type { RepairShop } from '../services/repairShops';

export type VCardDeliveryResult = 'shared' | 'downloaded' | 'cancelled';

function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function createVCardFileName(name: string): string {
  const safeName = name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-');
  return `${safeName || '수리업체'}.vcf`;
}

export function createRepairShopVCard(shop: Pick<RepairShop, 'name' | 'phone'>): string {
  const name = escapeVCardValue(shop.name.trim());
  const phone = escapeVCardValue(shop.phone.trim());
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `ORG:${name}`,
    `TEL;TYPE=WORK,VOICE:${phone}`,
    'END:VCARD',
  ].join('\r\n');
}

function downloadVCard(file: File): void {
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export async function deliverRepairShopVCard(
  shop: Pick<RepairShop, 'name' | 'phone'>,
): Promise<VCardDeliveryResult> {
  const file = new File(
    [createRepairShopVCard(shop)],
    createVCardFileName(shop.name),
    { type: 'text/vcard;charset=utf-8' },
  );

  let canShareFile = false;
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    try {
      canShareFile = navigator.canShare({ files: [file] });
    } catch {
      canShareFile = false;
    }
  }

  if (canShareFile) {
    try {
      await navigator.share({
        files: [file],
        title: `${shop.name} 연락처`,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }

  downloadVCard(file);
  return 'downloaded';
}
