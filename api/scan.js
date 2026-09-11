import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const result = await model.generateContent([
      "Extract transcript data from this image and return JSON only with fields: student_id, name, gpax, subjects (array of {code, name, credit, grade}).",
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const responseText = result.response.text();
    return res.status(200).send(responseText);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
