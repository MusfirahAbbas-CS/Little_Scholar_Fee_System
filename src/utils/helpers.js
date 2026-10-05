// Utility helpers
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-PK')}`;
}

export function formatMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function statusConfig(status) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', color: 'green', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' };
    case 'partially_paid':
      return { label: 'Partial', color: 'yellow', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' };
    case 'unpaid':
    default:
      return { label: 'Unpaid', color: 'red', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' };
  }
}

export function getInitials(firstName, lastName) {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
}

export function getAvatarColor(str) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ];
  const idx = (str?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

export function classLabel(cls) {
  if (!cls) return '';
  return `${cls.name} - Section ${cls.section}`;
}

export function shortMonthLabel(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('default', { month: 'short' }) + ' ' + year;
}

export function printFeeSlip(slip, classes = []) {
  const cls = classes.find(c => c.id === slip.student?.class_id);
  const className = cls ? `${cls.name} - ${cls.section}` : 'N/A';
  
  const generateSlipHTML = (copyType) => `
    <div style="flex: 1; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; font-family: sans-serif; position: relative; box-sizing: border-box; display: flex; flex-direction: column;">
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 20px; color: #1e293b;">LITTLE SCHOLAR ACADEMY</h2>
        <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Fee Slip - ${formatMonth(slip.billing_month)}</p>
        <span style="display: inline-block; background: #f1f5f9; padding: 4px 12px; border-radius: 99px; font-size: 11px; margin-top: 8px; font-weight: bold; border: 1px solid #e2e8f0; color: #334155;">
          ${copyType}
        </span>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #334155;">
        <div style="line-height: 1.5;">
          <strong>Name:</strong> ${slip.student?.first_name} ${slip.student?.last_name}<br/>
          <strong>Roll No:</strong> ${slip.student?.roll_number}<br/>
          <strong>Class:</strong> ${className}
        </div>
        <div style="text-align: right; line-height: 1.5;">
          <strong>Issue Date:</strong> ${new Date(slip.created_at).toLocaleDateString()}<br/>
          <strong>Slip ID:</strong> ${slip.id.split('-')[1]}
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; color: #334155;">
        <thead>
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <th style="text-align: left; padding: 8px 4px; color: #475569;">Description</th>
            <th style="text-align: right; padding: 8px 4px; color: #475569;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 4px; border-bottom: 1px solid #f1f5f9;">Tuition Fee</td>
            <td style="text-align: right; padding: 8px 4px; border-bottom: 1px solid #f1f5f9;">${formatCurrency(slip.tuition_amount)}</td>
          </tr>
          ${slip.items?.map(item => `
          <tr>
            <td style="padding: 8px 4px; border-bottom: 1px solid #f1f5f9;">${item.title}</td>
            <td style="text-align: right; padding: 8px 4px; border-bottom: 1px solid #f1f5f9;">${formatCurrency(item.amount)}</td>
          </tr>
          `).join('') || ''}
          <tr>
            <td style="padding: 8px 4px; border-bottom: 1px solid #f1f5f9; color: #f59e0b; font-weight: bold;">Previous Arrears</td>
            <td style="text-align: right; padding: 8px 4px; border-bottom: 1px solid #f1f5f9; color: #f59e0b; font-weight: bold;">${formatCurrency(slip.previous_arrears)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 12px 4px 4px; font-weight: bold; font-size: 15px;">Total Payable</td>
            <td style="text-align: right; padding: 12px 4px 4px; font-weight: bold; font-size: 15px;">${formatCurrency(slip.total_amount)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div style="margin-top: auto; padding-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
        <div style="border-top: 1px solid #cbd5e1; width: 140px; text-align: center; padding-top: 5px;">Bank Stamp / Sign</div>
        <div style="border-top: 1px solid #cbd5e1; width: 140px; text-align: center; padding-top: 5px;">Authorized Sign</div>
      </div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fee Slip - ${slip.student?.first_name}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
          .container { display: flex; flex-direction: column; height: calc(100vh - 20mm); gap: 30px; box-sizing: border-box; }
          .cut-line { text-align: center; border-bottom: 1px dashed #94a3b8; position: relative; margin: 5px 0; }
          .cut-line span { background: white; padding: 0 10px; font-size: 10px; color: #94a3b8; position: relative; top: 7px; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = function(){ window.close() };">
        <div class="container">
          ${generateSlipHTML('Student Copy')}
          <div class="cut-line"><span>✂ Cut Here ✂</span></div>
          ${generateSlipHTML('School / Office Copy')}
        </div>
      </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}
