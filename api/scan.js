export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
  }

  try {
    const { image } = req.body;

    // เปลี่ยน v1beta เป็น v1 และระบุเป็น gemini-1.5-flash-latest
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Extract transcript data from this image and return JSON only with fields: student_id, name, gpax, subjects (array of {code, name, credit, grade}).",
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image.split(',')[1] || image,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
