import './globals.css';

export const metadata = {
  title: 'สมุดค่าคอม — Daydream Massage & Spa',
  description: 'ระบบบันทึกและรายงานค่าคอมมิชชันสำหรับช่าง',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="font-sans text-ink antialiased">
        <div className="min-h-screen mx-auto max-w-md bg-[#eef1f7]">{children}</div>
      </body>
    </html>
  );
}
