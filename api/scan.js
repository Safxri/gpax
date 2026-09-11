export default async function handler(req, res) {
  // รับเฉพาะ HTTP POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'ไม่พบข้อมูลรูปภาพ' });
  }

  // ดึง API Key จากตัวแปรระบบบน Vercel (ถูกซ่อนปลอดภัย)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ไม่ได้ตั้งค่า GEMINI_API_KEY บนระบบ Server' });
  }

  const prompt = `ช่วยสแกนรูปภาพใบ ปพ.1 นี้ และดึงข้อมูลรายการวิชาที่มีหน่วยกิตและเกรด ออกมาเป็นรูปแบบ JSON Array โดยมี Key ดังนี้:
  - semester: ภาคเรียน เช่น "1/2566" หรือ "2/2566" (หากไม่ระบุให้ใส่อย่างเหมาะสม)
  - code: รหัสวิชา (เช่น ว31101, อ31101)
  - name: ชื่อวิชา (เช่น ฟิสิกส์ 1, ภาษาอังกฤษ 1)
  - group: ตัวอักษรตัวแรกของรหัสวิชา (เช่น ว, ค, ท, อ, ส, พ, ศ, ง, จ, ญ, ฝ)
  - credit: หน่วยกิต เป็นตัวเลข decimal (เช่น 1.0, 1.5)
  - grade: เกรดที่ได้ เป็นตัวเลข decimal (เช่น 4.0, 3.5)
  
  ข้ามวิชากิจกรรมพัฒนาผู้เรียนหรือวิชาที่ไม่คิดหน่วยกิต ตอบกลับเฉพาะข้อความ JSON Array บริสุทธิ์ โดยไม่ต้องมีโค้ดบล็อก Markdown`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: image } }
          ]
        }]
      })
    });

    const result = await response.json();

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    let rawText = result.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json(JSON.parse(rawText));

  } catch (err) {
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผล: ' + err.message });
  }
}
