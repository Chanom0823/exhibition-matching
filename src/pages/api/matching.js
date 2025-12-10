// pages/api/matching.js (หรือไฟล์ Function ทั่วไป)

export default function handler(req, res) {
  // 🔥 ใส่ Cache-Control Header ใน Object 'res'
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // สั่งห้าม Cache โดยเด็ดขาด
  res.status(200).json({ message: 'User matching data' });
}